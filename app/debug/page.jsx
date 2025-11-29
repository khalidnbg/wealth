"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Key,
  Server,
  Eye,
  EyeOff
} from "lucide-react";

export default function DebugPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case true:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
      case false:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variant = status === 'healthy' || status === true ? 'default' :
                   status === 'unhealthy' || status === false ? 'destructive' :
                   'secondary';

    return (
      <Badge variant={variant}>
        {typeof status === 'boolean' ? (status ? 'Connected' : 'Disconnected') : status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Debug</h1>
            <p className="text-gray-600 mt-2">
              Diagnostic information for troubleshooting production issues
            </p>
          </div>

          <Button
            onClick={fetchHealthData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span>Failed to fetch health data: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading diagnostic information...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {healthData && (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Overall System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {getStatusIcon(healthData.overall_status)}
                  {getStatusBadge(healthData.overall_status)}
                  <span className="text-sm text-gray-600">
                    Last checked: {new Date(healthData.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Environment: <Badge variant="outline">{healthData.environment}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {getStatusIcon(healthData.database?.connected)}
                  {getStatusBadge(healthData.database?.connected)}
                </div>

                {healthData.database?.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Database Error:</h4>
                    <div className="text-sm text-red-700 space-y-1">
                      <p><strong>Message:</strong> {healthData.database.error.message}</p>
                      {healthData.database.error.code && (
                        <p><strong>Code:</strong> {healthData.database.error.code}</p>
                      )}
                      <p><strong>Type:</strong> {healthData.database.error.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Environment Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(healthData.env_variables?.isValid)}
                    {getStatusBadge(healthData.env_variables?.isValid ? 'Valid' : 'Invalid')}
                  </div>

                  {/* Required Variables */}
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">
                      Required Variables Present ({healthData.env_variables?.present?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {healthData.env_variables?.present?.map((envVar) => (
                        <Badge key={envVar} variant="outline" className="bg-green-50">
                          {envVar}
                        </Badge>
                      )) || <span className="text-gray-500 text-sm">None found</span>}
                    </div>
                  </div>

                  {/* Optional Variables */}
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Optional Variables Present ({healthData.env_variables?.optional?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {healthData.env_variables?.optional?.map((envVar) => (
                        <Badge key={envVar} variant="outline" className="bg-blue-50">
                          {envVar}
                        </Badge>
                      )) || <span className="text-gray-500 text-sm">None found</span>}
                    </div>
                  </div>

                  {/* Missing Variables */}
                  {healthData.env_variables?.missing?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">
                        Missing Required Variables ({healthData.env_variables.missing.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {healthData.env_variables.missing.map((envVar) => (
                          <Badge key={envVar} variant="destructive">
                            {envVar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Debug Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Raw Debug Data
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2"
                  >
                    {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                </CardTitle>
              </CardHeader>
              {showDetails && (
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(healthData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    Go to Homepage
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
