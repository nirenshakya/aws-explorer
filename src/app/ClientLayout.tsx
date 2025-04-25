'use client';

import { useState, useEffect } from 'react';
import Search from "@/components/Search";
import SignInModal from '@/components/SignInModal';
import { ArrowRightOnRectangleIcon, CloudIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { secureStorage } from '@/lib/storage';
import Cookies from 'js-cookie';

const AWS_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-east-2', name: 'US East (Ohio)' },
  { id: 'us-west-1', name: 'US West (N. California)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'af-south-1', name: 'Africa (Cape Town)' },
  { id: 'ap-east-1', name: 'Asia Pacific (Hong Kong)' },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { id: 'ap-northeast-2', name: 'Asia Pacific (Seoul)' },
  { id: 'ap-northeast-3', name: 'Asia Pacific (Osaka)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { id: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
  { id: 'ca-central-1', name: 'Canada (Central)' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { id: 'eu-west-1', name: 'Europe (Ireland)' },
  { id: 'eu-west-2', name: 'Europe (London)' },
  { id: 'eu-west-3', name: 'Europe (Paris)' },
  { id: 'eu-north-1', name: 'Europe (Stockholm)' },
  { id: 'me-south-1', name: 'Middle East (Bahrain)' },
  { id: 'sa-east-1', name: 'South America (São Paulo)' },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<string>('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const storedCredentials = await secureStorage.get('awsCredentials');
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        setIsAuthenticated(true);
        setCurrentRegion(credentials.region);
        Cookies.set('awsCredentials', storedCredentials, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = async (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => {
    try {
      const credentialsString = JSON.stringify(credentials);
      await secureStorage.set('awsCredentials', credentialsString);
      Cookies.set('awsCredentials', credentialsString, { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      setIsAuthenticated(true);
      setCurrentRegion(credentials.region);
      setIsSignInModalOpen(false);
    } catch (error) {
      console.error('Failed to store credentials:', error);
    }
  };

  const handleSignOut = () => {
    secureStorage.remove('awsCredentials');
    Cookies.remove('awsCredentials');
    setIsAuthenticated(false);
    setCurrentRegion('');
  };

  const handleRegionChange = async (newRegion: string) => {
    try {
      const storedCredentials = await secureStorage.get('awsCredentials');
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        const updatedCredentials = {
          ...credentials,
          region: newRegion
        };
        const credentialsString = JSON.stringify(updatedCredentials);
        await secureStorage.set('awsCredentials', credentialsString);
        Cookies.set('awsCredentials', credentialsString, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        setCurrentRegion(newRegion);
      }
    } catch (error) {
      console.error('Failed to update region:', error);
    }
  };

  const getRegionName = (regionId: string) => {
    return AWS_REGIONS.find(region => region.id === regionId)?.name || regionId;
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <CloudIcon className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">AWS Explorer</h1>
            </div>
            <div className="flex-1 max-w-2xl mx-8">
              <Search />
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className="inline-flex items-center rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {getRegionName(currentRegion)}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </button>
                  {isRegionDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1 max-h-96 overflow-y-auto">
                        {AWS_REGIONS.map((region) => (
                          <button
                            key={region.id}
                            onClick={() => {
                              handleRegionChange(region.id);
                              setIsRegionDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm ${
                              currentRegion === region.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                >
                  <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} AWS Explorer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignIn={handleSignIn}
      />
    </div>
  );
} 