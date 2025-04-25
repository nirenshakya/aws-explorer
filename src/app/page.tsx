import { MagnifyingGlassIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Explore Your AWS Resources
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A modern interface to discover, monitor, and manage your AWS infrastructure with ease.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Explore Faster</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage AWS
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover and manage your AWS resources with our intuitive interface.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    name: 'Resource Discovery',
    description: 'Easily find and explore your AWS resources across all regions and services.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Real-time Monitoring',
    description: 'Monitor your resources in real-time with comprehensive metrics and alerts.',
    icon: ChartBarIcon,
  },
  {
    name: 'Secure Access',
    description: 'Manage access securely with AWS IAM integration and role-based controls.',
    icon: ShieldCheckIcon,
  },
];
