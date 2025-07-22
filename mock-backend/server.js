const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Kaspa API configuration
const KASPA_API_BASE = 'https://api.kaspa.org';
const KASPA_API_TIMEOUT = 15000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to make Kaspa API requests
async function kaspaRequest(endpoint, params = {}, options = {}) {
  try {
    const response = await axios({
      url: `${KASPA_API_BASE}${endpoint}`,
      params,
      timeout: KASPA_API_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlockDAG-Lens-Explorer/1.0.0'
      },
      method: options.method || 'GET',
      data: options.data
    });
    return response.data;
  } catch (error) {
    console.error(`Kaspa API error for ${endpoint}:`, error.message);
    throw error;
  }
}

// Helper function to transform Kaspa block data to our format
function transformBlock(kaspaBlock) {
  return {
    id: kaspaBlock.verboseData?.hash || kaspaBlock.header?.hashMerkleRoot,
    hash: kaspaBlock.verboseData?.hash || kaspaBlock.header?.hashMerkleRoot,
    parentHash: kaspaBlock.header?.parents?.[0]?.parentHashes?.[0] || null,
    timestamp: new Date(parseInt(kaspaBlock.header?.timestamp || Date.now())),
    confirmations: kaspaBlock.verboseData?.blueScore || 0,
    isTip: !kaspaBlock.verboseData?.childrenHashes || kaspaBlock.verboseData?.childrenHashes.length === 0,
    weight: kaspaBlock.header?.blueWork || 1,
    size: kaspaBlock.transactions?.length || 0,
    transactionCount: kaspaBlock.transactions?.length || 0,
    blueScore: kaspaBlock.verboseData?.blueScore || 0,
    difficulty: kaspaBlock.verboseData?.difficulty?.[0] || 0,
    daaScore: kaspaBlock.header?.daaScore || 0,
    selectedParentHash: kaspaBlock.verboseData?.selectedParentHash || null,
    childrenHashes: kaspaBlock.verboseData?.childrenHashes || [],
    isChainBlock: kaspaBlock.verboseData?.isChainBlock || false,
    version: kaspaBlock.header?.version || 1,
    bits: kaspaBlock.header?.bits || 0,
    nonce: kaspaBlock.header?.nonce || 0,
    pruningPoint: kaspaBlock.header?.pruningPoint || null,
    hashMerkleRoot: kaspaBlock.header?.hashMerkleRoot || null,
    acceptedIdMerkleRoot: kaspaBlock.header?.acceptedIdMerkleRoot || null,
    utxoCommitment: kaspaBlock.header?.utxoCommitment || null
  };
}

// Helper function to transform Kaspa transaction data
function transformTransaction(kaspaTx) {
  const inputs = kaspaTx.inputs || [];
  const outputs = kaspaTx.outputs || [];
  
  return {
    hash: kaspaTx.verboseData?.transactionId || kaspaTx.verboseData?.hash,
    from: inputs[0]?.previousOutpoint?.transactionId || 'unknown',
    to: outputs[0]?.verboseData?.scriptPublicKeyAddress || 'unknown',
    amount: outputs.reduce((sum, output) => sum + (output.amount || 0), 0),
    timestamp: new Date(kaspaTx.verboseData?.blockTime * 1000 || Date.now()),
    blockHash: kaspaTx.verboseData?.blockHash || null,
    status: kaspaTx.verboseData?.blockHash ? 'confirmed' : 'pending',
    fee: kaspaTx.mass || 0,
    size: kaspaTx.mass || 0,
    computeMass: kaspaTx.verboseData?.computeMass || 0,
    version: kaspaTx.version || 0,
    subnetworkId: kaspaTx.subnetworkId || '0000000000000000000000000000000000000000000000000000000000000000',
    lockTime: kaspaTx.lockTime || 0,
    gas: kaspaTx.gas || 0,
    payload: kaspaTx.payload || '',
    isAccepted: kaspaTx.is_accepted || false,
    acceptingBlockHash: kaspaTx.accepting_block_hash || null,
    acceptingBlockBlueScore: kaspaTx.accepting_block_blue_score || 0,
    acceptingBlockTime: kaspaTx.accepting_block_time || 0
  };
}

// API Routes

// Get recent blocks - using the correct Kaspa API endpoint
app.get('/api/blocks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Get recent blocks from Kaspa API using the correct endpoint
    // We need to get the latest block hash first, then get blocks from there
    const dagInfo = await kaspaRequest('/info/blockdag');
    
    // Get recent blocks using the blocks endpoint with a recent hash
    const recentBlocks = await kaspaRequest('/blocks', {
      lowHash: dagInfo.tipHashes?.[0] || '0000000000000000000000000000000000000000000000000000000000000000',
      includeBlocks: true,
      includeTransactions: false
    });
    
    // Transform blocks to our format
    const blocks = (recentBlocks.blocks || []).slice(0, limit).map(transformBlock);
    
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks from Kaspa network' });
  }
});

// Get specific block by hash
app.get('/api/blocks/:hash', async (req, res) => {
  try {
    const blockHash = req.params.hash;
    
    // Get block details from Kaspa API
    const kaspaBlock = await kaspaRequest(`/blocks/${blockHash}`, {
      includeTransactions: true
    });
    
    const block = transformBlock(kaspaBlock);
    
    // Add transaction details if available
    if (kaspaBlock.transactions) {
      block.transactions = kaspaBlock.transactions.map(transformTransaction);
    }
    
    res.json(block);
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(404).json({ error: 'Block not found' });
  }
});

// Get blocks from blue score
app.get('/api/blocks-from-bluescore', async (req, res) => {
  try {
    const blueScore = parseInt(req.query.blueScore) || 0;
    const includeTransactions = req.query.includeTransactions === 'true';
    
    const blocks = await kaspaRequest('/blocks-from-bluescore', {
      blueScore,
      includeTransactions
    });
    
    const transformedBlocks = blocks.map(transformBlock);
    res.json(transformedBlocks);
  } catch (error) {
    console.error('Error fetching blocks from blue score:', error);
    res.status(500).json({ error: 'Failed to fetch blocks from blue score' });
  }
});

// Get transaction by hash
app.get('/api/transactions/:hash', async (req, res) => {
  try {
    const txHash = req.params.hash;
    const blockHash = req.query.blockHash;
    const inputs = req.query.inputs === 'true';
    const outputs = req.query.outputs === 'true';
    const resolvePreviousOutpoints = req.query.resolve_previous_outpoints;
    
    // Get transaction details from Kaspa API
    const kaspaTx = await kaspaRequest(`/transactions/${txHash}`, {
      blockHash,
      inputs,
      outputs,
      resolve_previous_outpoints: resolvePreviousOutpoints
    });
    
    const transaction = transformTransaction(kaspaTx);
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// Search for transactions
app.post('/api/transactions/search', async (req, res) => {
  try {
    const { transactionIds, acceptingBlueScores } = req.body;
    const fields = req.query.fields;
    const resolvePreviousOutpoints = req.query.resolve_previous_outpoints;
    const acceptance = req.query.acceptance;
    
    const transactions = await kaspaRequest('/transactions/search', {
      fields,
      resolve_previous_outpoints: resolvePreviousOutpoints,
      acceptance
    }, {
      method: 'POST',
      data: {
        transactionIds,
        acceptingBlueScores
      }
    });
    
    const transformedTransactions = transactions.map(transformTransaction);
    res.json(transformedTransactions);
  } catch (error) {
    console.error('Error searching transactions:', error);
    res.status(500).json({ error: 'Failed to search transactions' });
  }
});

// Get transaction acceptance
app.post('/api/transactions/acceptance', async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    const acceptance = await kaspaRequest('/transactions/acceptance', {}, {
      method: 'POST',
      data: { transactionIds }
    });
    
    res.json(acceptance);
  } catch (error) {
    console.error('Error getting transaction acceptance:', error);
    res.status(500).json({ error: 'Failed to get transaction acceptance' });
  }
});

// Submit a new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { transaction, allowOrphan } = req.body;
    const replaceByFee = req.query.replaceByFee === 'true';
    
    const result = await kaspaRequest('/transactions', {
      replaceByFee
    }, {
      method: 'POST',
      data: {
        transaction,
        allowOrphan
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error submitting transaction:', error);
    res.status(400).json({ error: 'Failed to submit transaction' });
  }
});

// Calculate transaction mass
app.post('/api/transactions/mass', async (req, res) => {
  try {
    const { transaction } = req.body;
    
    const result = await kaspaRequest('/transactions/mass', {}, {
      method: 'POST',
      data: { transaction }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error calculating transaction mass:', error);
    res.status(500).json({ error: 'Failed to calculate transaction mass' });
  }
});

// Get address information
app.get('/api/addresses/:address', async (req, res) => {
  try {
    const address = req.params.address;
    
    // Get address balance from Kaspa API
    const balanceInfo = await kaspaRequest(`/addresses/${address}/balance`);
    
    // Get address transactions from Kaspa API
    const transactions = await kaspaRequest(`/addresses/${address}/full-transactions`, {
      limit: 20
    });
    
    res.json({
      address: address,
      balance: balanceInfo.balance || 0,
      transactions: (transactions.transactions || []).map(transformTransaction)
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get address balance
app.get('/api/addresses/:address/balance', async (req, res) => {
  try {
    const address = req.params.address;
    const balanceInfo = await kaspaRequest(`/addresses/${address}/balance`);
    res.json(balanceInfo);
  } catch (error) {
    console.error('Error fetching address balance:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get address UTXOs
app.get('/api/addresses/:address/utxos', async (req, res) => {
  try {
    const address = req.params.address;
    const utxos = await kaspaRequest(`/addresses/${address}/utxos`);
    res.json(utxos);
  } catch (error) {
    console.error('Error fetching address UTXOs:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get UTXOs for multiple addresses
app.post('/api/addresses/utxos', async (req, res) => {
  try {
    const { addresses } = req.body;
    const utxos = await kaspaRequest('/addresses/utxos', {}, {
      method: 'POST',
      data: { addresses }
    });
    res.json(utxos);
  } catch (error) {
    console.error('Error fetching UTXOs for addresses:', error);
    res.status(500).json({ error: 'Failed to fetch UTXOs' });
  }
});

// Get active addresses
app.post('/api/addresses/active', async (req, res) => {
  try {
    const { addresses } = req.body;
    const activeAddresses = await kaspaRequest('/addresses/active', {}, {
      method: 'POST',
      data: { addresses }
    });
    res.json(activeAddresses);
  } catch (error) {
    console.error('Error fetching active addresses:', error);
    res.status(500).json({ error: 'Failed to fetch active addresses' });
  }
});

// Get address distribution
app.get('/api/addresses/distribution', async (req, res) => {
  try {
    const distribution = await kaspaRequest('/addresses/distribution');
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching address distribution:', error);
    res.status(500).json({ error: 'Failed to fetch address distribution' });
  }
});

// Get address names
app.get('/api/addresses/names', async (req, res) => {
  try {
    const names = await kaspaRequest('/addresses/names');
    res.json(names);
  } catch (error) {
    console.error('Error fetching address names:', error);
    res.status(500).json({ error: 'Failed to fetch address names' });
  }
});

// Get name for specific address
app.get('/api/addresses/:address/name', async (req, res) => {
  try {
    const address = req.params.address;
    const name = await kaspaRequest(`/addresses/${address}/name`);
    res.json(name);
  } catch (error) {
    console.error('Error fetching address name:', error);
    res.status(404).json({ error: 'Address name not found' });
  }
});

// Get top addresses (rich list)
app.get('/api/addresses/top', async (req, res) => {
  try {
    const topAddresses = await kaspaRequest('/addresses/top');
    res.json(topAddresses);
  } catch (error) {
    console.error('Error fetching top addresses:', error);
    res.status(500).json({ error: 'Failed to fetch top addresses' });
  }
});

// Get full transactions for address
app.get('/api/addresses/:address/full-transactions', async (req, res) => {
  try {
    const address = req.params.address;
    const transactions = await kaspaRequest(`/addresses/${address}/full-transactions`);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching full transactions for address:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get full transactions page for address
app.get('/api/addresses/:address/full-transactions-page', async (req, res) => {
  try {
    const address = req.params.address;
    const transactions = await kaspaRequest(`/addresses/${address}/full-transactions-page`);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching full transactions page for address:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get transaction count for address
app.get('/api/addresses/:address/transactions-count', async (req, res) => {
  try {
    const address = req.params.address;
    const count = await kaspaRequest(`/addresses/${address}/transactions-count`);
    res.json(count);
  } catch (error) {
    console.error('Error fetching transaction count for address:', error);
    res.status(404).json({ error: 'Address not found' });
  }
});

// Get balances for multiple addresses
app.post('/api/addresses/balances', async (req, res) => {
  try {
    const { addresses } = req.body;
    const balances = await kaspaRequest('/addresses/balances', {}, {
      method: 'POST',
      data: { addresses }
    });
    res.json(balances);
  } catch (error) {
    console.error('Error fetching balances for addresses:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Get network metrics using the correct Kaspa API endpoints
app.get('/api/metrics', async (req, res) => {
  try {
    // Get network info from Kaspa API
    const networkInfo = await kaspaRequest('/info/network');
    const dagInfo = await kaspaRequest('/info/blockdag');
    const coinSupply = await kaspaRequest('/info/coinsupply');
    const hashrate = await kaspaRequest('/info/hashrate');
    const price = await kaspaRequest('/info/price');
    const feeEstimate = await kaspaRequest('/info/fee-estimate');
    const blockReward = await kaspaRequest('/info/blockreward');
    const halving = await kaspaRequest('/info/halving');
    const marketCap = await kaspaRequest('/info/marketcap');
    
    // Get recent blocks for tip calculation
    const recentBlocks = await kaspaRequest('/blocks', {
      lowHash: dagInfo.tipHashes?.[0] || '0000000000000000000000000000000000000000000000000000000000000000',
      includeBlocks: true,
      includeTransactions: false
    });
    
    const tipBlocks = (recentBlocks.blocks || []).filter(block => 
      !block.verboseData?.childrenHashes || block.verboseData?.childrenHashes.length === 0
    );
    
    const metrics = {
      tps: networkInfo.tps || 0,
      confirmationLatency: networkInfo.confirmationLatency || 0,
      tipPoolSize: tipBlocks.length,
      orphanRate: networkInfo.orphanRate || 0,
      totalBlocks: dagInfo.blockCount || 0,
      totalTransactions: dagInfo.transactionCount || 0,
      difficulty: dagInfo.difficulty || 0,
      virtualDaaScore: dagInfo.virtualDaaScore || 0,
      circulatingSupply: coinSupply.circulating || 0,
      totalSupply: coinSupply.total || 0,
      hashrate: hashrate.hashrate || 0,
      price: price.price || 0,
      marketCap: marketCap.marketCap || 0,
      tipHashes: dagInfo.tipHashes || [],
      virtualParentHashes: dagInfo.virtualParentHashes || [],
      networkName: dagInfo.networkName || 'kaspa-mainnet',
      feeEstimate: feeEstimate.feeEstimate || 0,
      blockReward: blockReward.blockReward || 0,
      halving: halving.halving || 0,
      timestamp: new Date()
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch network metrics' });
  }
});

// Get virtual chain blue score
app.get('/api/info/virtual-chain-blue-score', async (req, res) => {
  try {
    const blueScore = await kaspaRequest('/info/virtual-chain-blue-score');
    res.json(blueScore);
  } catch (error) {
    console.error('Error fetching virtual chain blue score:', error);
    res.status(500).json({ error: 'Failed to fetch virtual chain blue score' });
  }
});

// Get network info
app.get('/api/info/network', async (req, res) => {
  try {
    const networkInfo = await kaspaRequest('/info/network');
    res.json(networkInfo);
  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({ error: 'Failed to fetch network info' });
  }
});

// Get BlockDAG info
app.get('/api/info/blockdag', async (req, res) => {
  try {
    const dagInfo = await kaspaRequest('/info/blockdag');
    res.json(dagInfo);
  } catch (error) {
    console.error('Error fetching BlockDAG info:', error);
    res.status(500).json({ error: 'Failed to fetch BlockDAG info' });
  }
});

// Get coin supply
app.get('/api/info/coinsupply', async (req, res) => {
  try {
    const coinSupply = await kaspaRequest('/info/coinsupply');
    res.json(coinSupply);
  } catch (error) {
    console.error('Error fetching coin supply:', error);
    res.status(500).json({ error: 'Failed to fetch coin supply' });
  }
});

// Get circulating coins
app.get('/api/info/coinsupply/circulating', async (req, res) => {
  try {
    const circulating = await kaspaRequest('/info/coinsupply/circulating');
    res.json(circulating);
  } catch (error) {
    console.error('Error fetching circulating coins:', error);
    res.status(500).json({ error: 'Failed to fetch circulating coins' });
  }
});

// Get total coins
app.get('/api/info/coinsupply/total', async (req, res) => {
  try {
    const total = await kaspaRequest('/info/coinsupply/total');
    res.json(total);
  } catch (error) {
    console.error('Error fetching total coins:', error);
    res.status(500).json({ error: 'Failed to fetch total coins' });
  }
});

// Get Kaspad info
app.get('/api/info/kaspad', async (req, res) => {
  try {
    const kaspadInfo = await kaspaRequest('/info/kaspad');
    res.json(kaspadInfo);
  } catch (error) {
    console.error('Error fetching Kaspad info:', error);
    res.status(500).json({ error: 'Failed to fetch Kaspad info' });
  }
});

// Get fee estimate
app.get('/api/info/fee-estimate', async (req, res) => {
  try {
    const feeEstimate = await kaspaRequest('/info/fee-estimate');
    res.json(feeEstimate);
  } catch (error) {
    console.error('Error fetching fee estimate:', error);
    res.status(500).json({ error: 'Failed to fetch fee estimate' });
  }
});

// Get price
app.get('/api/info/price', async (req, res) => {
  try {
    const price = await kaspaRequest('/info/price');
    res.json(price);
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Get block reward
app.get('/api/info/blockreward', async (req, res) => {
  try {
    const blockReward = await kaspaRequest('/info/blockreward');
    res.json(blockReward);
  } catch (error) {
    console.error('Error fetching block reward:', error);
    res.status(500).json({ error: 'Failed to fetch block reward' });
  }
});

// Get halving
app.get('/api/info/halving', async (req, res) => {
  try {
    const halving = await kaspaRequest('/info/halving');
    res.json(halving);
  } catch (error) {
    console.error('Error fetching halving:', error);
    res.status(500).json({ error: 'Failed to fetch halving' });
  }
});

// Get hashrate
app.get('/api/info/hashrate', async (req, res) => {
  try {
    const hashrate = await kaspaRequest('/info/hashrate');
    res.json(hashrate);
  } catch (error) {
    console.error('Error fetching hashrate:', error);
    res.status(500).json({ error: 'Failed to fetch hashrate' });
  }
});

// Get max hashrate
app.get('/api/info/hashrate/max', async (req, res) => {
  try {
    const maxHashrate = await kaspaRequest('/info/hashrate/max');
    res.json(maxHashrate);
  } catch (error) {
    console.error('Error fetching max hashrate:', error);
    res.status(500).json({ error: 'Failed to fetch max hashrate' });
  }
});

// Get hashrate history
app.get('/api/info/hashrate/history', async (req, res) => {
  try {
    const hashrateHistory = await kaspaRequest('/info/hashrate/history');
    res.json(hashrateHistory);
  } catch (error) {
    console.error('Error fetching hashrate history:', error);
    res.status(500).json({ error: 'Failed to fetch hashrate history' });
  }
});

// Get health state
app.get('/api/info/health', async (req, res) => {
  try {
    const health = await kaspaRequest('/info/health');
    res.json(health);
  } catch (error) {
    console.error('Error fetching health state:', error);
    res.status(500).json({ error: 'Failed to fetch health state' });
  }
});

// Get market cap
app.get('/api/info/marketcap', async (req, res) => {
  try {
    const marketCap = await kaspaRequest('/info/marketcap');
    res.json(marketCap);
  } catch (error) {
    console.error('Error fetching market cap:', error);
    res.status(500).json({ error: 'Failed to fetch market cap' });
  }
});

// Get virtual chain transactions
app.get('/api/virtual-chain', async (req, res) => {
  try {
    const virtualChain = await kaspaRequest('/virtual-chain');
    res.json(virtualChain);
  } catch (error) {
    console.error('Error fetching virtual chain:', error);
    res.status(500).json({ error: 'Failed to fetch virtual chain' });
  }
});

// Search functionality
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Try to find block by hash
    let blocks = [];
    let transactions = [];
    
    try {
      const block = await kaspaRequest(`/blocks/${query}`);
      blocks = [transformBlock(block)];
    } catch (blockError) {
      // Block not found, continue with transaction search
    }
    
    try {
      const tx = await kaspaRequest(`/transactions/${query}`);
      transactions = [transformTransaction(tx)];
    } catch (txError) {
      // Transaction not found
    }
    
    res.json({
      query: query,
      blocks: blocks,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get DAG info for visualization
app.get('/api/dag', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // Get DAG info from Kaspa API using the specific BlockDAG endpoint
    const dagInfo = await kaspaRequest('/info/blockdag');
    
    // Get recent blocks for DAG visualization
    const recentBlocks = await kaspaRequest('/blocks', {
      lowHash: dagInfo.tipHashes?.[0] || '0000000000000000000000000000000000000000000000000000000000000000',
      includeBlocks: true,
      includeTransactions: false
    });
    
    // Transform and add parent relationships
    const dagBlocks = (recentBlocks.blocks || []).slice(0, limit).map(block => {
      const transformed = transformBlock(block);
      transformed.parents = block.header?.parents?.[0]?.parentHashes || [];
      return transformed;
    });
    
    res.json({
      blocks: dagBlocks,
      totalBlocks: dagInfo.blockCount || 0,
      tipHashes: dagInfo.tipHashes || [],
      virtualParentHashes: dagInfo.virtualParentHashes || [],
      difficulty: dagInfo.difficulty || 0,
      virtualDaaScore: dagInfo.virtualDaaScore || 0,
      pruningPointHash: dagInfo.pruningPointHash || null,
      sink: dagInfo.sink || null,
      networkName: dagInfo.networkName || 'kaspa-mainnet'
    });
  } catch (error) {
    console.error('Error fetching DAG:', error);
    res.status(500).json({ error: 'Failed to fetch DAG data' });
  }
});

// Get network health
app.get('/api/health', async (req, res) => {
  try {
    const healthInfo = await kaspaRequest('/info/health');
    const networkInfo = await kaspaRequest('/info/network');
    const kaspadInfo = await kaspaRequest('/info/kaspad');
    
    res.json({
      status: 'healthy',
      kaspaNetwork: 'connected',
      timestamp: new Date(),
      health: healthInfo,
      networkInfo: {
        name: networkInfo.name || 'Kaspa',
        version: kaspadInfo.version || 'unknown',
        subnetworkId: networkInfo.subnetworkId || 'unknown'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      kaspaNetwork: 'disconnected',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// WebSocket handling for real-time updates
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial metrics
  const sendMetrics = async () => {
    try {
      const networkInfo = await kaspaRequest('/info/network');
      const dagInfo = await kaspaRequest('/info/blockdag');
      const coinSupply = await kaspaRequest('/info/coinsupply');
      const hashrate = await kaspaRequest('/info/hashrate');
      const price = await kaspaRequest('/info/price');
      const feeEstimate = await kaspaRequest('/info/fee-estimate');
      const blockReward = await kaspaRequest('/info/blockreward');
      const halving = await kaspaRequest('/info/halving');
      const marketCap = await kaspaRequest('/info/marketcap');
      
      // Get recent blocks for tip calculation
      const recentBlocks = await kaspaRequest('/blocks', {
        lowHash: dagInfo.tipHashes?.[0] || '0000000000000000000000000000000000000000000000000000000000000000',
        includeBlocks: true,
        includeTransactions: false
      });
      
      const tipBlocks = (recentBlocks.blocks || []).filter(block => 
        !block.verboseData?.childrenHashes || block.verboseData?.childrenHashes.length === 0
      );
      
      const metrics = {
        tps: networkInfo.tps || 0,
        confirmationLatency: networkInfo.confirmationLatency || 0,
        tipPoolSize: tipBlocks.length,
        orphanRate: networkInfo.orphanRate || 0,
        totalBlocks: dagInfo.blockCount || 0,
        totalTransactions: dagInfo.transactionCount || 0,
        difficulty: dagInfo.difficulty || 0,
        virtualDaaScore: dagInfo.virtualDaaScore || 0,
        circulatingSupply: coinSupply.circulating || 0,
        totalSupply: coinSupply.total || 0,
        hashrate: hashrate.hashrate || 0,
        price: price.price || 0,
        marketCap: marketCap.marketCap || 0,
        tipHashes: dagInfo.tipHashes || [],
        virtualParentHashes: dagInfo.virtualParentHashes || [],
        networkName: dagInfo.networkName || 'kaspa-mainnet',
        feeEstimate: feeEstimate.feeEstimate || 0,
        blockReward: blockReward.blockReward || 0,
        halving: halving.halving || 0,
        timestamp: new Date()
      };
      
      ws.send(JSON.stringify(metrics));
    } catch (error) {
      console.error('Error sending WebSocket metrics:', error);
    }
  };
  
  // Send initial metrics
  sendMetrics();
  
  // Send periodic updates every 10 seconds
  const interval = setInterval(sendMetrics, 10000);
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(interval);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Kaspa API Backend Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`🌐 Connected to Kaspa network at ${KASPA_API_BASE}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Real-time Kaspa BlockDAG data visualization ready!`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   - /api/blocks - Get recent blocks`);
  console.log(`   - /api/blocks/:hash - Get specific block`);
  console.log(`   - /api/transactions/:hash - Get transaction details`);
  console.log(`   - /api/addresses/:address - Get address info`);
  console.log(`   - /api/metrics - Get network metrics`);
  console.log(`   - /api/dag - Get BlockDAG visualization data`);
  console.log(`   - /api/info/* - Get various network info`);
}); 