"use client";
import { fetchAuthSession } from 'aws-amplify/auth';

export const checkAdminGroups = async () => {
  try {
    const { tokens } = await fetchAuthSession();
    if (tokens) {
      return tokens.accessToken.payload["cognito:groups"] || [];
    }
    return [];
  } catch (error) {
    console.error('Error checking admin groups:', error);
    return [];
  }
};