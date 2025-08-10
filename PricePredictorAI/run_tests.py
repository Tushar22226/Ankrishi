"""
Test runner for the price prediction system
"""

import unittest
import sys
import os

def run_tests():
    """Run all tests"""
    # Discover and run tests
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover('.', pattern='test_*.py')
    
    # Run tests
    test_runner = unittest.TextTestRunner(verbosity=2)
    result = test_runner.run(test_suite)
    
    # Return exit code based on test results
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    # Set environment variables for tests
    os.environ['PLOT_TESTS'] = 'True'  # Enable plotting in tests
    
    # Run tests
    sys.exit(run_tests())
