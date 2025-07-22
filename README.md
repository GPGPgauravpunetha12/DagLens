# BlockDAG Lens Explorer

An interactive 3D/2D visualization tool for BlockDAG topology with real-time metrics and network health monitoring.

## 🚀 Features

- **Interactive 3D/2D Visualization**: Explore BlockDAG topology with Three.js and D3.js
- **Real-time Metrics**: Live TPS, confirmation latency, tip pool size, orphan rate
- **Search & Navigation**: Search by address, transaction, or block with contextual highlighting
- **Network Health Dashboard**: Comprehensive network monitoring and analytics
- **WebSocket Real-time Updates**: Live data streaming for instant updates
- **Beautiful Modern UI**: Dark theme with glass morphism effects and smooth animations

## 🛠️ Tech Stack

- **Frontend**: React + Three.js + D3.js + Recharts + Framer Motion
- **Backend**: Go + WebSockets + Gorilla Mux
- **Database**: PostgreSQL + TimescaleDB
- **Real-time**: WebSocket connections
- **Containerization**: Docker + Docker Compose

## ⚡ Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd blockdag-lens-explorer
   ```

2. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - WebSocket: ws://localhost:8080/ws

### Option 2: Manual Setup

1. **Install Dependencies**:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   
   # Install backend dependencies
   cd backend
   go mod tidy
   cd ..
   ```

2. **Setup Database**:
   ```bash
   # Install PostgreSQL and TimescaleDB
   # Create database and run migrations
   psql -U postgres -d blockdag -f database/schema.sql
   ```

3. **Start Development**:
   ```bash
   # Start backend
   cd backend
   go run main.go
   
   # Start frontend (in new terminal)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
blockdag-lens-explorer/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── styles/         # Styled components
│   └── public/             # Static assets
├── backend/                 # Go server
│   ├── main.go             # Main server file
│   ├── go.mod              # Go module file
│   └── go.sum              # Go dependencies
├── database/               # Database schemas and migrations
│   └── schema.sql          # PostgreSQL schema with TimescaleDB
├── docker-compose.yml      # Docker services configuration
├── setup.sh               # Automated setup script
└── README.md              # This file
```

## 🔌 API Endpoints

### REST API
- `GET /api/blocks` - Get blocks with pagination
- `GET /api/blocks/:id` - Get specific block details
- `GET /api/transactions/:hash` - Get transaction details
- `GET /api/addresses/:address` - Get address information
- `GET /api/metrics` - Get real-time metrics
- `GET /api/search?q=query` - Search blocks and transactions

### WebSocket
- `WS /ws` - Real-time updates for metrics and new blocks

## 🎨 Features Overview

### Dashboard
- **3D BlockDAG Visualization**: Interactive 3D view of the DAG structure
- **Real-time Metrics Cards**: TPS, latency, tip pool size, orphan rate
- **Recent Blocks**: Live feed of latest blocks
- **Network Status**: Connection status and health indicators

### Block Explorer
- **Block Search**: Search by block ID or hash
- **Block Details**: Comprehensive block information
- **Status Indicators**: Visual status badges for different confirmation levels
- **Parent-Child Relationships**: Display block connections

### Transaction Explorer
- **Transaction Search**: Search by transaction hash or address
- **Transaction Flow**: Visual representation of sender to receiver
- **Status Tracking**: Real-time transaction status updates
- **Amount Display**: Formatted transaction amounts

### Network Metrics
- **Time Series Charts**: TPS, latency, tip pool size over time
- **Interactive Charts**: Area, line, bar, and pie charts
- **Time Range Selection**: 1 hour, 24 hours, 7 days views
- **Real-time Updates**: Live data streaming via WebSocket

## 🐳 Docker Commands

```bash
# backend
cd ./mock-backend

cd ./frontend


npm start
```

## 🔧 Configuration

Copy the example environment file and customize as needed:

```bash
cp env.example .env
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Backend server port (default: 8080)
- `REACT_APP_API_URL`: Frontend API URL
- `WS_URL`: WebSocket connection URL

## 📊 Database Schema

The application uses PostgreSQL with TimescaleDB extension for time-series data:

- **blocks**: Block information with DAG relationships
- **transactions**: Transaction details and status
- **metrics**: Time-series metrics data (TimescaleDB hypertable)
- **dag_relationships**: Materialized view for DAG connections

## 🚀 Performance Features

- **WebSocket Real-time Updates**: Instant data streaming
- **TimescaleDB**: Optimized time-series data storage
- **Materialized Views**: Pre-computed DAG relationships
- **Indexing**: Optimized database queries
- **Caching**: React Query for efficient data fetching

## 🎯 Use Cases

- **Blockchain Researchers**: Analyze BlockDAG topology and performance
- **Network Operators**: Monitor network health and metrics
- **Developers**: Debug and understand transaction flows
- **Analysts**: Study network behavior and patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js**: 3D visualization library
- **D3.js**: Data visualization library
- **Recharts**: React charting library
- **TimescaleDB**: Time-series database extension
- **Gorilla WebSocket**: WebSocket implementation for Go

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**Made with ❤️ for the BlockDAG community** 
