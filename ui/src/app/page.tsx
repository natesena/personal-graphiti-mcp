'use client'

import { useState, useEffect } from 'react'

interface QueueStatus {
  group_queues: {
    [groupId: string]: {
      size: number
      worker_active: boolean
      items: string[]
    }
  }
}

export default function Dashboard() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueueStatus = async () => {
    try {
      console.log('Fetching queue status from localhost:8100...')
      // Call the queue status endpoint directly
      const response = await fetch('http://localhost:8100/queue/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Queue status data:', data)
      setQueueStatus(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching queue status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch queue status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueueStatus()
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const getTotalQueueSize = () => {
    if (!queueStatus) return 0
    return Object.values(queueStatus.group_queues).reduce((total, group) => total + group.size, 0)
  }

  const getActiveWorkers = () => {
    if (!queueStatus) return 0
    return Object.values(queueStatus.group_queues).filter(group => group.worker_active).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Graphiti Management Console</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor queue status, processing progress, and system health
          </p>
          <p className="mt-1 text-xs text-green-600 font-mono">
            🚀 Development Mode - Hot Reload Active ({new Date().toLocaleTimeString()})
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Queue Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Queue Status</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? 'Loading...' : error ? 'Error' : `${getTotalQueueSize()} items`}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Workers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Workers</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? 'Loading...' : error ? 'Error' : getActiveWorkers()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? 'Loading...' : error ? '⚠️ Error' : '✅ All Good'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Queue Details</h3>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading queue status...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading queue status</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {queueStatus && !error && (
              <div className="space-y-4">
                {Object.entries(queueStatus.group_queues).map(([groupId, groupData]) => (
                  <div key={groupId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Group: {groupId}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          groupData.worker_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {groupData.worker_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {groupData.size} items
                        </span>
                      </div>
                    </div>
                    
                    {groupData.items.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Queue Items:</h5>
                        <ul className="space-y-1">
                          {groupData.items.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={fetchQueueStatus}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
          
          <button
            onClick={() => {
              console.log('Test button clicked - simulating activity');
              // This simulates activity for testing
              setQueueStatus({
                group_queues: {
                  "test-group": {
                    size: 2,
                    worker_active: true,
                    items: ["test-episode-1.txt", "test-episode-2.txt"]
                  }
                }
              });
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            🧪 Test Activity
          </button>
        </div>
      </div>
    </div>
  )
}
