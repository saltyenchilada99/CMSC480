/**
 * test-api.ts
 * Test script to verify Verizon Connect API connectivity
 *
 * Run with: npm run test-api
 */

import 'dotenv/config';
import {
    getVehicles,
    getVehicleLocation,
    Vehicle,
    VehicleLocation
} from './VZConnectAPICalls';

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function success(message: string): void {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message: string): void {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message: string): void {
    console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function heading(message: string): void {
    console.log(`\n${colors.bold}${colors.blue}${message}${colors.reset}`);
}

async function testApiConnection() {
    console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════╗
║   Verizon Connect API Connection Test            ║
╚═══════════════════════════════════════════════════╝
${colors.reset}`);

    // Check environment variables
    heading('1. Checking Configuration');
    const hasUsername = !!process.env.VZC_USERNAME && process.env.VZC_USERNAME !== 'YOUR_USERNAME';
    const hasPassword = !!process.env.VZC_PASSWORD && process.env.VZC_PASSWORD !== 'YOUR_PASSWORD';
    const hasAppId = !!process.env.VZC_APP_ID && process.env.VZC_APP_ID !== 'YOUR_APP_ID';

    if (hasUsername) {
        success(`VZC_USERNAME is set: ${process.env.VZC_USERNAME}`);
    } else {
        error('VZC_USERNAME is not set or still using placeholder');
    }

    if (hasPassword) {
        success('VZC_PASSWORD is set');
    } else {
        error('VZC_PASSWORD is not set or still using placeholder');
    }

    if (hasAppId) {
        success(`VZC_APP_ID is set: ${process.env.VZC_APP_ID}`);
    } else {
        error('VZC_APP_ID is not set or still using placeholder');
    }

    if (!hasUsername || !hasPassword || !hasAppId) {
        error('\nPlease set your Verizon Connect credentials in .env file');
        info('Copy .env to .env and fill in your credentials');
        process.exit(1);
    }

    try {
        // Test 1: Fetch vehicles
        heading('2. Testing Vehicle API (GET /cmd/v1/vehicles)');
        info('Fetching vehicle list...');

        const vehicles: Vehicle[] = await getVehicles();

        if (vehicles.length === 0) {
            error('No vehicles found in your account');
            info('Make sure vehicles have Vehicle Numbers set in Verizon Connect REVEAL');
            process.exit(1);
        }

        success(`Found ${vehicles.length} vehicle(s):`);
        const validVehicles: Vehicle[] = [];
        const invalidVehicles: Vehicle[] = [];

        vehicles.forEach((v, idx) => {
            const hasValidNumber = v.VehicleNumber && v.VehicleNumber !== 'null';
            if (hasValidNumber) {
                validVehicles.push(v);
                console.log(`   ${idx + 1}. [${v.VehicleNumber}] ${v.VehicleName || '(unnamed)'}`);
            } else {
                invalidVehicles.push(v);
                console.log(`   ${idx + 1}. ${colors.yellow}[NO VEHICLE NUMBER]${colors.reset} ${v.VehicleName || '(unnamed)'}`);
            }
            if (v.Make || v.Model || v.Year) {
                console.log(`      ${v.Year || ''} ${v.Make || ''} ${v.Model || ''}`.trim());
            }
        });

        if (invalidVehicles.length > 0) {
            console.log(`\n   ${colors.yellow}⚠${colors.reset} ${invalidVehicles.length} vehicle(s) are missing Vehicle Numbers`);
            info('These vehicles need Vehicle Numbers set in Verizon Connect REVEAL to track their location');
        }

        if (validVehicles.length === 0) {
            error('\nNo vehicles with valid Vehicle Numbers found');
            info('Please set Vehicle Numbers in Verizon Connect REVEAL:');
            console.log('  1. Log in to https://fim.us.fleetmatics.com');
            console.log('  2. Go to Admin > Vehicles');
            console.log('  3. Edit each vehicle and set a Vehicle Number (e.g., "BUS01", "BUS02")');
            console.log('  4. Save changes and re-run this test');
            process.exit(1);
        }

        // Test 2: Try to fetch location for vehicles with valid numbers
        heading('3. Testing Vehicle Location API (GET /rad/v1/vehicles/{id}/location)');

        let testLocation: VehicleLocation | null = null;
        let testedVehicle: Vehicle | null = null;

        for (const vehicle of validVehicles) {
            try {
                info(`Attempting to fetch location for vehicle: ${vehicle.VehicleNumber}`);
                testLocation = await getVehicleLocation(vehicle.VehicleNumber);
                testedVehicle = vehicle;
                break; // Success! Stop trying
            } catch (err: any) {
                error(`  ${err.message}`);
                if (vehicle === validVehicles[validVehicles.length - 1]) {
                    // This was the last vehicle
                    error('\n⚠ None of your vehicles have recent GPS data');
                    info('This is normal if:');
                    console.log('  - Vehicles are not currently powered on');
                    console.log('  - Vehicles haven\'t been driven recently');
                    console.log('  - GPS devices need activation');
                    info('\nSkipping individual location test, will try bulk fetch...');
                } else {
                    info('  Trying next vehicle...');
                }
            }
        }

        if (testLocation && testedVehicle) {
            success('Location data received:');
            console.log(`   Raw response:`, JSON.stringify(testLocation, null, 2));
            console.log(`   Vehicle:      ${testLocation.VehicleName || testLocation.VehicleNumber || 'Unknown'}`);
            console.log(`   Coordinates:  ${testLocation.Latitude}, ${testLocation.Longitude}`);
            console.log(`   Status:       ${testLocation.Status || 'Unknown'}`);
            console.log(`   Speed:        ${testLocation.Speed} mph`);
            console.log(`   Heading:      ${testLocation.Heading}°`);
            if (testLocation.LastUpdated) {
                console.log(`   Last Updated: ${new Date(testLocation.LastUpdated).toLocaleString()}`);
            }
            if (testLocation.Address) {
                console.log(`   Address:      ${typeof testLocation.Address === 'object' ? JSON.stringify(testLocation.Address) : testLocation.Address}`);
            }
            if (testLocation.Driver) {
                console.log(`   Driver:       ${testLocation.Driver}`);
            }
        }

        // Test 3: Fetch all locations
        heading('4. Testing Bulk Location Fetch');
        info(`Fetching locations for ${validVehicles.length} vehicle(s) with valid numbers...`);

        const vehicleNumbers = validVehicles.map(v => v.VehicleNumber);
        const { getAllVehicleLocations } = await import('./VZConnectAPICalls');
        const allLocations: VehicleLocation[] = await getAllVehicleLocations(vehicleNumbers);

        if (allLocations.length === 0) {
            error('No location data available for any vehicles');
            info('Possible reasons:');
            console.log('  - Vehicles are not currently powered on or in use');
            console.log('  - GPS devices need to be activated');
            console.log('  - Vehicles need to transmit their first GPS signal');
            info('\nThe server will still work - it will show buses once they start transmitting GPS data.');
        } else {
            success(`Retrieved ${allLocations.length} location(s):`);
            console.log('\n   Raw location data:');
            console.log(JSON.stringify(allLocations, null, 2));
            console.log('\n   Vehicle Name          Status      Speed   Coordinates');
            console.log('   ─────────────────────────────────────────────────────────────');
            allLocations.forEach(loc => {
                const name = ((loc.VehicleName || loc.VehicleNumber) || 'Unknown').padEnd(20);
                const status = (loc.Status || 'Unknown').padEnd(10);
                const speed = `${loc.Speed || 0} mph`.padEnd(8);
                const coords = `${(loc.Latitude || 0).toFixed(5)}, ${(loc.Longitude || 0).toFixed(5)}`;
                console.log(`   ${name} ${status} ${speed} ${coords}`);
            });
        }

        // Test 4: Validate data quality
        if (allLocations.length > 0) {
            heading('5. Data Quality Checks');

            let hasValidCoordinates = true;
            let hasRecentUpdates = true;
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);

            allLocations.forEach(loc => {
                // Check for valid coordinates
                if (loc.Latitude === 0 && loc.Longitude === 0) {
                    hasValidCoordinates = false;
                }
                // Check if data is recent (within last hour)
                const lastUpdate = new Date(loc.LastUpdated).getTime();
                if (lastUpdate < oneHourAgo) {
                    hasRecentUpdates = false;
                }
            });

            if (hasValidCoordinates) {
                success('All vehicles have valid GPS coordinates');
            } else {
                error('Some vehicles have invalid coordinates (0, 0)');
            }

            if (hasRecentUpdates) {
                success('All vehicle data is recent (within last hour)');
            } else {
                error('Some vehicle data may be stale (older than 1 hour)');
                info('This is normal if vehicles are not currently in use');
            }
        }

        // Success summary
        heading('✓ API Connection Successful!');

        if (allLocations.length > 0) {
            console.log(`
Your Verizon Connect API integration is working correctly with active GPS data!

Next steps:
  1. Start the server:      ${colors.yellow}npm start${colors.reset}
  2. Open in browser:       ${colors.yellow}http://localhost:3000${colors.reset}

The server will poll for bus locations every 30 seconds and display
them on an interactive Leaflet map.
            `);
        } else {
            console.log(`
Your Verizon Connect API connection is working, but no vehicles have recent GPS data.

${colors.yellow}Action Required:${colors.reset}
  • Turn on and drive the buses to generate GPS data, OR
  • Assign Vehicle Numbers to vehicles that ARE transmitting data

You can still start the server - it will show buses once they begin transmitting:
  1. Start the server:      ${colors.yellow}npm start${colors.reset}
  2. Open in browser:       ${colors.yellow}http://localhost:3000${colors.reset}

The map will automatically update when buses start transmitting GPS data.
            `);
        }

    } catch (err: any) {
        heading('✗ Test Failed');
        error(`Error: ${err.message}`);

        if (err.message.includes('Token fetch failed')) {
            info('\nAuthentication failed. Please check:');
            console.log('  - VZC_USERNAME is correct');
            console.log('  - VZC_PASSWORD is correct');
            console.log('  - Your account has access to the Verizon Connect API');
        } else if (err.message.includes('failed: 401')) {
            info('\nAuthorization failed. Please check:');
            console.log('  - VZC_APP_ID is correct (format: companyname-p-us-xxxxx)');
            console.log('  - Your account has the required API licenses activated');
        } else if (err.message.includes('failed: 403')) {
            info('\nAccess forbidden. Please check:');
            console.log('  - The required APIs are activated in your FIM portal');
            console.log('  - Your account has permission to access these APIs');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
            info('\nNetwork error. Please check:');
            console.log('  - You have internet connectivity');
            console.log('  - The API endpoint is accessible from your network');
        }

        console.log('\nFull error details:');
        console.error(err);
        process.exit(1);
    }
}

// Run the test
void testApiConnection();
