/**
 * Validates connections in the circuit graph.
 * Returns an array of feedback objects: { type: 'error' | 'warning', message: string }
 */
export const validateConnections = (nodes, edges) => {
    const feedback = [];

    // Helper functions
    const isPower = (h) => ['5V', '3V3', '3.3V', 'VIN', 'VCC'].some(p => h.includes(p));
    const isGround = (h) => ['GND', 'GROUND'].some(p => h.includes(p));
    const isGPIO = (h) => /D\d+|GPIO\d+|PIN\d+/.test(h); // Digital pins like D0, D1, GPIO5, etc.
    const isSignal = (h) => ['SIG', 'SIGNAL', 'PWM', 'TX', 'RX', 'SCL', 'SDA'].some(p => h.includes(p));
    const isAnalog = (h) => /A\d+/.test(h); // Analog pins like A0, A1, etc.

    edges.forEach(edge => {
        const sourceHandle = edge.sourceHandle || '';
        const targetHandle = edge.targetHandle || '';
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // Normalize handles to uppercase for easier comparison
        const s = sourceHandle.toUpperCase();
        const t = targetHandle.toUpperCase();

        // 1. SHORT CIRCUIT DETECTION (Power <-> Ground) - CRITICAL ERROR
        if ((isPower(s) && isGround(t)) || (isPower(t) && isGround(s))) {
            feedback.push({
                type: 'error',
                message: `⚠️ SHORT CIRCUIT! Connecting ${sourceHandle} to ${targetHandle} will damage your circuit.`
            });
            return; // Skip other checks for this edge
        }

        // 2. CROSS-VOLTAGE (5V <-> 3.3V) - ERROR
        if ((s.includes('5V') && (t.includes('3V3') || t.includes('3.3V'))) ||
            (t.includes('5V') && (s.includes('3V3') || s.includes('3.3V')))) {
            feedback.push({
                type: 'error',
                message: `Voltage Mismatch: Connecting 5V to 3.3V may damage 3.3V components.`
            });
            return;
        }

        // 3. POWER/GROUND TO GPIO - WARNING (won't work as expected)
        if ((isPower(s) && isGPIO(t)) || (isPower(t) && isGPIO(s))) {
            feedback.push({
                type: 'warning',
                message: `Incorrect Connection: GPIO pin (${isGPIO(s) ? sourceHandle : targetHandle}) should not be directly connected to power. This won't work as a signal connection.`
            });
        }

        if ((isGround(s) && isGPIO(t)) || (isGround(t) && isGPIO(s))) {
            feedback.push({
                type: 'warning',
                message: `Incorrect Connection: GPIO pin (${isGPIO(s) ? sourceHandle : targetHandle}) connected to ground will always read LOW. This is likely not what you want.`
            });
        }

        // 4. POWER/GROUND TO SIGNAL PIN - WARNING
        if ((isPower(s) && isSignal(t)) || (isPower(t) && isSignal(s))) {
            const signalPin = isSignal(s) ? sourceHandle : targetHandle;
            if (!signalPin.includes('VCC')) { // VCC is expected to connect to power
                feedback.push({
                    type: 'warning',
                    message: `Signal Pin Issue: ${signalPin} should connect to a GPIO/PWM pin, not directly to power.`
                });
            }
        }

        if ((isGround(s) && isSignal(t)) || (isGround(t) && isSignal(s))) {
            const signalPin = isSignal(s) ? sourceHandle : targetHandle;
            if (!signalPin.includes('GND')) { // GND is expected to connect to ground
                feedback.push({
                    type: 'warning',
                    message: `Signal Pin Issue: ${signalPin} should connect to a GPIO/PWM pin, not directly to ground.`
                });
            }
        }

        // 5. OUTPUT CONFLICT (TX <-> TX, etc.)
        if (s.includes('TX') && t.includes('TX')) {
            feedback.push({
                type: 'warning',
                message: `Signal Conflict: Connecting two TX (transmit) pins together may cause issues.`
            });
        }

        // 6. ANALOG PIN TO POWER/GROUND - WARNING
        if ((isPower(s) && isAnalog(t)) || (isPower(t) && isAnalog(s))) {
            feedback.push({
                type: 'warning',
                message: `Analog Pin Issue: Analog pins should read varying voltages, not be connected directly to power.`
            });
        }

        // 7. SERVO/MOTOR POWER WARNINGS
        if (sourceNode?.type === 'servoMotor' || targetNode?.type === 'servoMotor') {
            // Check if VCC is connected to appropriate power
            if ((s === 'VCC' && !isPower(t) && !isGPIO(t)) || (t === 'VCC' && !isPower(s) && !isGPIO(s))) {
                feedback.push({
                    type: 'warning',
                    message: `Servo Power: VCC should be connected to 5V or 3.3V power supply.`
                });
            }

            // Check if SIG is connected to GPIO
            if ((s === 'SIG' && !isGPIO(t) && !isSignal(t)) || (t === 'SIG' && !isGPIO(s) && !isSignal(s))) {
                feedback.push({
                    type: 'warning',
                    message: `Servo Signal: SIG should be connected to a PWM-capable GPIO pin (like D9, D10, D11).`
                });
            }
        }
    });

    return feedback;
};
