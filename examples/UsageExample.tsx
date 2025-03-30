import React from 'react';
import { SocketProvider, useSocket } from '../src/context/SocketContext';

// Define custom user data type
interface CustomUserData {
  age: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const UserProfile = () => {
  // Use the socket context with our custom type
  const { 
    setUserData, 
    userData,
    isLoggedIn 
  } = useSocket<CustomUserData>();

  const handleUpdate = () => {
    if (isLoggedIn) {
      // Type-safe usage of setUserData
      setUserData({
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      });
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      {userData && (
        <div>
          <p>Age: {userData.age}</p>
          <p>Theme: {userData.preferences.theme}</p>
          <p>Notifications: {userData.preferences.notifications ? 'On' : 'Off'}</p>
        </div>
      )}
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  );
};

const App = () => {
  return (
    <SocketProvider<CustomUserData> 
      socketUrl="ws://localhost:3000"
      userDataTransformer={(data) => ({
        age: Number(data.age),
        preferences: {
          theme: data.theme || 'light',
          notifications: Boolean(data.notifications)
        }
      })}
    >
      <UserProfile />
    </SocketProvider>
  );
};

export default App;