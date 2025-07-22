# Kaspa REST-API Server

## Overview and Purpose

This project provides a RESTful API server for the Kaspa blockchain, enabling easy access to real-time network metrics, block and transaction data, address balances, and more. It acts as a bridge between Kaspa's high-performance BlockDAG node (kaspad) and web or analytics applications, making it simple to build dashboards, explorers, and monitoring tools.

Key features:
- Real-time metrics: Orphan rate, TPS, confirmation latency, blue ratio, tip pool size, and more
- Block, transaction, and address search endpoints
- Activity monitoring and network health endpoints
- Designed for extensibility and integration with modern web frontends

## Installation

### Prerequisites
- Python 3.8+
- [pip](https://pip.pypa.io/en/stable/)
- (Optional) [Poetry](https://python-poetry.org/) for dependency management

### Steps
1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/kaspa-rest-server.git
   cd kaspa-rest-server/kaspa-main
   ```
2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   # or, if using Poetry
   poetry install
   ```
3. **(Optional) Set environment variables:**
   - Copy `env.example` to `.env` and adjust as needed.

4. **Run the server:**
   ```sh
   uvicorn main:app --reload
   # or, if using the provided server.py
   python server.py
   ```

## Usage

- The API will be available at `http://localhost:8000` (or your configured port).
- Visit `http://localhost:8000/docs` for interactive OpenAPI documentation.
- Example endpoints:
  - `/metrics` — Real-time network metrics (TPS, orphan rate, etc.)
  - `/blocks` — List or search blocks
  - `/transactions/{transactionId}` — Get transaction details
  - `/addresses/{kaspaAddress}/balance` — Get address balance

### Example: Fetching Metrics
```sh
curl http://localhost:8000/metrics
```

### Example: Get Block Info
```sh
curl http://localhost:8000/blocks/{blockId}
```

## License

MIT License

Copyright (c) 2024 Kaspa Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
