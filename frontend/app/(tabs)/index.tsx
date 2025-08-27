import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL;

type RootStackParamList = {
  Register: undefined;
  Login: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

function RegisterScreen({ navigation }: { navigation: RegisterScreenNavigationProp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/register`, { username, password }, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Alert.alert('Success', response.data.message);
      navigation.navigate('Login');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert('Error', error.response?.data?.detail || 'Registration failed');
      } else {
        Alert.alert('Error', 'Registration failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

// Login Screen
function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password }, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToken(response.data.access_token);
      Alert.alert('Success', 'Logged in!');
      await AsyncStorage.setItem('token', response.data.access_token);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert('Error', error.response?.data?.detail || 'Login failed');
      } else {
        Alert.alert('Error', 'Login failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      {token ? <Text style={styles.text}>Token: {token}</Text> : null}
    </View>
  );
}

// Navigation Setup
const Stack = createStackNavigator();

export default function App() {
  return (
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    marginTop: 20,
  },
});