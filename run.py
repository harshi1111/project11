#!/usr/bin/env python3
"""
Intelligent Enterprise Assistant - Main Runner
"""

import os
import sys
import webbrowser
import threading
import time
from backend.app import app

def start_backend():
    """Start the Flask backend server"""
    print("Starting Intelligent Enterprise Assistant Backend...")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

def start_frontend():
    """Serve the frontend and open in browser"""
    time.sleep(2)  # Wait for backend to start
    
    frontend_path = os.path.join(os.path.dirname(__file__), 'frontend')
    if os.path.exists(frontend_path):
        # For production, you'd use a proper web server
        # For development, we'll just open the HTML file
        index_file = os.path.join(frontend_path, 'index.html')
        if os.path.exists(index_file):
            print("Opening Intelligent Enterprise Assistant in browser...")
            webbrowser.open(f'file://{index_file}')
        else:
            print("Frontend files not found. Please check the frontend directory.")
    else:
        print("Frontend directory not found.")

if __name__ == '__main__':
    print("=" * 60)
    print("Intelligent Enterprise Assistant for Public Sector")
    print("Advanced AI Chatbot with Security & Document Processing")
    print("=" * 60)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=start_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Start frontend
    start_frontend()
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down Intelligent Enterprise Assistant...")
        sys.exit(0)