export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">CC Switcher</h1>
          <p className="text-xl text-gray-300 mb-8">
            A CLI tool for switching Claude Code accounts, supporting quick switching between different API endpoints and authentication tokens.
          </p>
          <div className="bg-gray-800 rounded-lg p-6 text-left">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto">
              <code className="text-green-400">{`# Install shell integration
./setup.sh

# Add a configuration
ccs add work --base-url https://api.anthropic.com --token sk-xxx

# Switch configuration
ccs select work`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
