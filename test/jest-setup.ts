/**
 * Global Jest setup file
 * Suppresses console output during tests for cleaner test output
 */

// Save original console methods
const originalConsole = {
	log: console.log,
	error: console.error,
	warn: console.warn,
	info: console.info,
	debug: console.debug,
};

// Suppress all console output during tests
global.console = {
	...console,
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
} as any;

// Optionally restore for debugging specific tests
// You can call this in individual test files if needed
(global as any).restoreConsole = () => {
	global.console = originalConsole as any;
};

// Optionally keep only error messages visible
// Uncomment this if you want to see errors but suppress other logs
// global.console = {
// 	...console,
// 	log: jest.fn(),
// 	warn: jest.fn(),
// 	info: jest.fn(),
// 	debug: jest.fn(),
// 	error: originalConsole.error, // Keep errors visible
// } as any;
