package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	_ "github.com/lib/pq"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for development
		},
	}
	clients   = make(map[*websocket.Conn]bool)
	broadcast = make(chan interface{})
	db        *sql.DB
)

type Block struct {
	ID          string    `json:"id"`
	Hash        string    `json:"hash"`
	ParentHash  string    `json:"parentHash"`
	Timestamp   time.Time `json:"timestamp"`
	Transactions []string `json:"transactions"`
	Confirmations int     `json:"confirmations"`
	IsTip       bool      `json:"isTip"`
	Weight      int       `json:"weight"`
}

type Transaction struct {
	Hash      string    `json:"hash"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Amount    float64   `json:"amount"`
	Timestamp time.Time `json:"timestamp"`
	BlockHash string    `json:"blockHash"`
	Status    string    `json:"status"`
}

type Metrics struct {
	TPS           float64 `json:"tps"`
	ConfirmationLatency float64 `json:"confirmationLatency"`
	TipPoolSize   int     `json:"tipPoolSize"`
	OrphanRate    float64 `json:"orphanRate"`
	TotalBlocks   int     `json:"totalBlocks"`
	TotalTransactions int `json:"totalTransactions"`
	Timestamp     time.Time `json:"timestamp"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found")
	}

	// Initialize database
	initDatabase()

	// Start WebSocket broadcaster
	go handleMessages()

	// Setup router
	r := mux.NewRouter()

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	api.HandleFunc("/blocks", getBlocks).Methods("GET")
	api.HandleFunc("/blocks/{id}", getBlock).Methods("GET")
	api.HandleFunc("/transactions/{hash}", getTransaction).Methods("GET")
	api.HandleFunc("/addresses/{address}", getAddress).Methods("GET")
	api.HandleFunc("/metrics", getMetrics).Methods("GET")
	api.HandleFunc("/search", search).Methods("GET")

	// WebSocket endpoint
	r.HandleFunc("/ws", handleConnections)

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logrus.Infof("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func initDatabase() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:password@localhost:5432/blockdag?sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		logrus.Fatal("Error connecting to database:", err)
	}

	if err = db.Ping(); err != nil {
		logrus.Fatal("Error pinging database:", err)
	}

	logrus.Info("Connected to database successfully")
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logrus.Error("Error upgrading connection:", err)
		return
	}
	defer ws.Close()

	clients[ws] = true

	// Send initial data
	metrics := getCurrentMetrics()
	ws.WriteJSON(metrics)

	for {
		var msg map[string]interface{}
		err := ws.ReadJSON(&msg)
		if err != nil {
			logrus.Error("Error reading message:", err)
			delete(clients, ws)
			break
		}
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				logrus.Error("Error writing message:", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func getBlocks(w http.ResponseWriter, r *http.Request) {
	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "50"
	}

	query := `SELECT id, hash, parent_hash, timestamp, confirmations, is_tip, weight 
			  FROM blocks ORDER BY timestamp DESC LIMIT $1`
	
	rows, err := db.Query(query, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var blocks []Block
	for rows.Next() {
		var block Block
		err := rows.Scan(&block.ID, &block.Hash, &block.ParentHash, &block.Timestamp, 
						&block.Confirmations, &block.IsTip, &block.Weight)
		if err != nil {
			continue
		}
		blocks = append(blocks, block)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}

func getBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	query := `SELECT id, hash, parent_hash, timestamp, confirmations, is_tip, weight 
			  FROM blocks WHERE id = $1 OR hash = $1`
	
	var block Block
	err := db.QueryRow(query, id).Scan(&block.ID, &block.Hash, &block.ParentHash, 
									  &block.Timestamp, &block.Confirmations, &block.IsTip, &block.Weight)
	if err != nil {
		http.Error(w, "Block not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(block)
}

func getTransaction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash := vars["hash"]

	query := `SELECT hash, from_address, to_address, amount, timestamp, block_hash, status 
			  FROM transactions WHERE hash = $1`
	
	var tx Transaction
	err := db.QueryRow(query, hash).Scan(&tx.Hash, &tx.From, &tx.To, &tx.Amount, 
										&tx.Timestamp, &tx.BlockHash, &tx.Status)
	if err != nil {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tx)
}

func getAddress(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	// Get transactions for address
	query := `SELECT hash, from_address, to_address, amount, timestamp, block_hash, status 
			  FROM transactions WHERE from_address = $1 OR to_address = $1 ORDER BY timestamp DESC LIMIT 20`
	
	rows, err := db.Query(query, address)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var tx Transaction
		err := rows.Scan(&tx.Hash, &tx.From, &tx.To, &tx.Amount, &tx.Timestamp, 
						&tx.BlockHash, &tx.Status)
		if err != nil {
			continue
		}
		transactions = append(transactions, tx)
	}

	response := map[string]interface{}{
		"address": address,
		"transactions": transactions,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := getCurrentMetrics()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func getCurrentMetrics() Metrics {
	// Calculate TPS (last 1 minute)
	var tps float64
	query := `SELECT COUNT(*) FROM transactions WHERE timestamp > NOW() - INTERVAL '1 minute'`
	db.QueryRow(query).Scan(&tps)
	tps = tps / 60.0

	// Get tip pool size
	var tipPoolSize int
	query = `SELECT COUNT(*) FROM blocks WHERE is_tip = true`
	db.QueryRow(query).Scan(&tipPoolSize)

	// Get total blocks and transactions
	var totalBlocks, totalTransactions int
	db.QueryRow("SELECT COUNT(*) FROM blocks").Scan(&totalBlocks)
	db.QueryRow("SELECT COUNT(*) FROM transactions").Scan(&totalTransactions)

	// Calculate orphan rate (simplified)
	var orphanRate float64
	query = `SELECT COUNT(*) FROM blocks WHERE confirmations = 0`
	var orphanCount int
	db.QueryRow(query).Scan(&orphanCount)
	if totalBlocks > 0 {
		orphanRate = float64(orphanCount) / float64(totalBlocks) * 100
	}

	return Metrics{
		TPS:               tps,
		ConfirmationLatency: 2.5, // Mock value
		TipPoolSize:       tipPoolSize,
		OrphanRate:        orphanRate,
		TotalBlocks:       totalBlocks,
		TotalTransactions: totalTransactions,
		Timestamp:         time.Now(),
	}
}

func search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter required", http.StatusBadRequest)
		return
	}

	// Search in blocks
	var blocks []Block
	blockQuery := `SELECT id, hash, parent_hash, timestamp, confirmations, is_tip, weight 
				   FROM blocks WHERE hash ILIKE $1 OR id ILIKE $1 LIMIT 10`
	rows, err := db.Query(blockQuery, "%"+query+"%")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var block Block
			rows.Scan(&block.ID, &block.Hash, &block.ParentHash, &block.Timestamp, 
					  &block.Confirmations, &block.IsTip, &block.Weight)
			blocks = append(blocks, block)
		}
	}

	// Search in transactions
	var transactions []Transaction
	txQuery := `SELECT hash, from_address, to_address, amount, timestamp, block_hash, status 
				FROM transactions WHERE hash ILIKE $1 OR from_address ILIKE $1 OR to_address ILIKE $1 LIMIT 10`
	rows, err = db.Query(txQuery, "%"+query+"%")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tx Transaction
			rows.Scan(&tx.Hash, &tx.From, &tx.To, &tx.Amount, &tx.Timestamp, 
					  &tx.BlockHash, &tx.Status)
			transactions = append(transactions, tx)
		}
	}

	response := map[string]interface{}{
		"query": query,
		"blocks": blocks,
		"transactions": transactions,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
} 