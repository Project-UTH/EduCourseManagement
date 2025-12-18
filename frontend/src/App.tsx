import { useEffect, useState } from 'react';
import { healthApi } from './services/api/healthApi';
import './App.css';

interface HealthData {
  status: string;
  message: string;
  timestamp: string;
  database: string;
}

function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await healthApi.check();
        console.log('Health check response:', response);
        setHealth(response.data);
      } catch (err: unknown) {
        console.error('Failed to fetch health:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to backend';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#282c34',
      color: 'white',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
        Education Course Management System
      </h1>
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '40px', color: '#61dafb' }}>
        Frontend + Backend Integration Test
      </h2>
      
      {loading && (
        <div style={{ fontSize: '1.2rem' }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#ff4444',
          borderRadius: '8px',
          marginTop: '20px',
        }}>
          <h3>❌ Cannot connect to Backend</h3>
          <p>Make sure backend is running on http://localhost:8080</p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            Error: {error}
          </p>
        </div>
      )}

      {health && !loading && (
        <div style={{
          padding: '30px',
          backgroundColor: '#44ff44',
          color: '#000',
          borderRadius: '8px',
          marginTop: '20px',
          maxWidth: '600px',
        }}>
          <h3>✅ Backend Connected!</h3>
          <pre style={{
            backgroundColor: '#f4f4f4',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            textAlign: 'left',
          }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;