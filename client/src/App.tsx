
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SpeedTestResult } from '../../server/src/schema';

function App() {
  const [currentTest, setCurrentTest] = useState<SpeedTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<SpeedTestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const loadLatestTest = useCallback(async () => {
    try {
      const result = await trpc.getLatestSpeedTest.query();
      setCurrentTest(result);
    } catch (error) {
      console.error('Failed to load latest test:', error);
    }
  }, []);

  const loadTestHistory = useCallback(async () => {
    try {
      const result = await trpc.getSpeedTestHistory.query({ limit: 10, offset: 0 });
      setTestHistory(result);
    } catch (error) {
      console.error('Failed to load test history:', error);
    }
  }, []);

  useEffect(() => {
    loadLatestTest();
    loadTestHistory();
  }, [loadLatestTest, loadTestHistory]);

  const runSpeedTest = async () => {
    setIsRunningTest(true);
    setTestProgress(0);
    
    // Simulate progress updates during test
    const progressInterval = setInterval(() => {
      setTestProgress((prev: number) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const result = await trpc.runSpeedTest.mutate();
      setCurrentTest(result);
      setTestHistory((prev: SpeedTestResult[]) => [result, ...prev.slice(0, 9)]);
      setTestProgress(100);
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsRunningTest(false);
        setTestProgress(0);
      }, 1000);
    }
  };

  const formatSpeed = (speed: number): string => {
    return speed.toFixed(2);
  };

  const getSpeedBadgeColor = (speed: number): string => {
    if (speed >= 100) return 'bg-green-500';
    if (speed >= 50) return 'bg-yellow-500';
    if (speed >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 Speed Test</h1>
          <p className="text-gray-600">Test your internet connection speed</p>
        </div>

        {/* Current Test Results */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Current Speed Test</CardTitle>
            <CardDescription>
              {currentTest ? 'Latest test results' : 'No tests performed yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRunningTest ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Testing your connection...</p>
                  <Progress value={testProgress} className="w-full h-4" />
                  <p className="text-sm text-gray-500 mt-2">{Math.round(testProgress)}% complete</p>
                </div>
              </div>
            ) : currentTest ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Download Speed</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatSpeed(currentTest.download_speed)} <span className="text-lg">Mbps</span>
                      </p>
                    </div>
                    <Badge className={`${getSpeedBadgeColor(currentTest.download_speed)} text-white`}>
                      {currentTest.download_speed >= 100 ? 'Excellent' : 
                       currentTest.download_speed >= 50 ? 'Good' :
                       currentTest.download_speed >= 25 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Upload Speed</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatSpeed(currentTest.upload_speed)} <span className="text-lg">Mbps</span>
                      </p>
                    </div>
                    <Badge className={`${getSpeedBadgeColor(currentTest.upload_speed)} text-white`}>
                      {currentTest.upload_speed >= 100 ? 'Excellent' : 
                       currentTest.upload_speed >= 50 ? 'Good' :
                       currentTest.upload_speed >= 25 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Ping</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {currentTest.ping.toFixed(0)} <span className="text-sm">ms</span>
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Jitter</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {currentTest.jitter.toFixed(1)} <span className="text-sm">ms</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Server:</span> {currentTest.server_location}</p>
                    <p><span className="font-medium">Duration:</span> {currentTest.test_duration}s</p>
                    <p><span className="font-medium">Tested:</span> {currentTest.created_at.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Click the button below to run your first speed test</p>
              </div>
            )}

            <div className="text-center mt-6">
              <Button 
                onClick={runSpeedTest}
                disabled={isRunningTest}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                {isRunningTest ? '🔄 Testing...' : '🚀 Start Speed Test'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test History */}
        {testHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Test History
              </CardTitle>
              <CardDescription>Your recent speed test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testHistory.map((test: SpeedTestResult) => (
                  <div key={test.id}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Download</p>
                          <p className="font-bold text-blue-600">
                            {formatSpeed(test.download_speed)} Mbps
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Upload</p>
                          <p className="font-bold text-green-600">
                            {formatSpeed(test.upload_speed)} Mbps
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Ping</p>
                          <p className="font-bold text-orange-600">
                            {test.ping.toFixed(0)} ms
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{test.server_location}</p>
                        <p className="text-xs text-gray-500">{test.created_at.toLocaleDateString()}</p>
                      </div>
                    </div>
                    {test.id !== testHistory[testHistory.length - 1].id && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>💡 Tip: Close other applications and browser tabs for more accurate results</p>
        </div>
      </div>
    </div>
  );
}

export default App;
