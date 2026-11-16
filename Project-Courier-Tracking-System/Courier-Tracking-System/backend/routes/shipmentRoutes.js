
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Track shipment using tracking number
router.get('/track/:trackingNumber', (req, res) => {

    const trackingNumber = req.params.trackingNumber;

    const sql = `
        SELECT
            s.*,
            sender.name AS sender_name,
            sender.phone AS sender_phone,
            sender.address AS sender_address,
            receiver.name AS receiver_name,
            receiver.phone AS receiver_phone,
            receiver.address AS receiver_address
        FROM shipments s
        JOIN customers sender
            ON s.sender_id = sender.customer_id
        JOIN customers receiver
            ON s.receiver_id = receiver.customer_id
        WHERE s.tracking_number = ?
    `;

    db.query(sql, [trackingNumber], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: 'Shipment not found'
            });
        }

        const shipment = results[0];

        const historySql = `
            SELECT status, location, remarks, updated_at
            FROM tracking_updates
            WHERE shipment_id = ?
            ORDER BY updated_at DESC
        `;

        db.query(
            historySql,
            [shipment.shipment_id],
            (err, updates) => {

                if (err) {
                    return res.status(500).json({
                        message: 'Error fetching tracking history'
                    });
                }

                res.json({
                    shipment,
                    tracking_history: updates
                });
            }
        );
    });
});



// Add a new shipment
router.post('/add', (req, res) => {

    const {
        senderName,
        senderPhone,
        senderAddress,
        receiverName,
        receiverPhone,
        receiverAddress,
        weight
    } = req.body;

    // Basic validation
    if (
        !senderName || !senderPhone || !senderAddress ||
        !receiverName || !receiverPhone || !receiverAddress ||
        !weight || Number(weight) <= 0
    ) {
        return res.status(400).json({
            message: 'Please fill all required fields correctly'
        });
    }

    // Insert sender
    const senderSql = `
        INSERT INTO customers (name, phone, address)
        VALUES (?, ?, ?)
    `;

    db.query(
        senderSql,
        [senderName, senderPhone, senderAddress],
        (err, senderResult) => {

            if (err) {
                return res.status(500).json({
                    message: 'Error adding sender'
                });
            }

            const senderId = senderResult.insertId;

            // Insert receiver
            db.query(
                senderSql,
                [receiverName, receiverPhone, receiverAddress],
                (err, receiverResult) => {

                    if (err) {
                        return res.status(500).json({
                            message: 'Error adding receiver'
                        });
                    }

                    const receiverId = receiverResult.insertId;

                    const trackingNumber =
                        'CR' + Date.now();

                    const shipmentSql = `
                        INSERT INTO shipments
                        (tracking_number, sender_id, receiver_id,
                        shipment_date, expected_delivery, weight, status)
                        VALUES (?, ?, ?, CURDATE(),
                        DATE_ADD(CURDATE(), INTERVAL 3 DAY),
                        ?, 'Booked')
                    `;

                    db.query(
                        shipmentSql,
                        [trackingNumber, senderId, receiverId, weight],
                        (err, shipmentResult) => {

                            if (err) {
                                return res.status(500).json({
                                    message: 'Error creating shipment'
                                });
                            }

                            const shipmentId = shipmentResult.insertId;

                            // Add initial tracking update
                            const historySql = `
                                INSERT INTO tracking_updates
                                (shipment_id, status, location, remarks)
                                VALUES (?, 'Booked', ?, ?)
                            `;

                            db.query(
                                historySql,
                                [
                                    shipmentId,
                                    senderAddress,
                                    'Shipment booked successfully'
                                ],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            message: 'Shipment created but tracking history failed'
                                        });
                                    }

                                    res.status(201).json({
                                        message: 'Shipment created successfully',
                                        trackingNumber: trackingNumber
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


// Update shipment status
router.post('/update-status', (req, res) => {

    const { trackingNumber, status, location, remarks } = req.body;

    const allowedStatuses = [
        'Booked',
        'In Transit',
        'Out for Delivery',
        'Delivered'
    ];

    if (!trackingNumber || !allowedStatuses.includes(status) || !location) {
        return res.status(400).json({
            message: 'Please provide valid shipment details'
        });
    }

    // Find shipment
    const findSql = `
        SELECT shipment_id
        FROM shipments
        WHERE tracking_number = ?
    `;

    db.query(findSql, [trackingNumber], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: 'Shipment not found'
            });
        }

        const shipmentId = results[0].shipment_id;

        // Update current shipment status
        const updateSql = `
            UPDATE shipments
            SET status = ?
            WHERE shipment_id = ?
        `;

        db.query(updateSql, [status, shipmentId], (err) => {

            if (err) {
                return res.status(500).json({
                    message: 'Error updating shipment'
                });
            }

            // Add tracking history
            const historySql = `
                INSERT INTO tracking_updates
                (shipment_id, status, location, remarks)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                historySql,
                [shipmentId, status, location, remarks || 'Status updated'],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message: 'Error adding tracking history'
                        });
                    }

                    res.json({
                        message: 'Shipment status updated successfully'
                    });
                }
            );
        });
    });
});



// Get all shipments
router.get('/all', (req, res) => {

    const sql = `
        SELECT
            s.shipment_id,
            s.tracking_number,
            sender.name AS sender_name,
            receiver.name AS receiver_name,
            s.shipment_date,
            s.weight,
            s.status
        FROM shipments s
        JOIN customers sender
            ON s.sender_id = sender.customer_id
        JOIN customers receiver
            ON s.receiver_id = receiver.customer_id
        ORDER BY s.shipment_id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: 'Error fetching shipments'
            });
        }

        res.json(results);
    });
});



// Delete shipment
router.delete('/delete/:trackingNumber', (req, res) => {

    const trackingNumber = req.params.trackingNumber;

    const findSql = `
        SELECT shipment_id
        FROM shipments
        WHERE tracking_number = ?
    `;

    db.query(findSql, [trackingNumber], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: 'Shipment not found'
            });
        }

        const shipmentId = results[0].shipment_id;

        // Delete tracking history first
        db.query(
            'DELETE FROM tracking_updates WHERE shipment_id = ?',
            [shipmentId],
            (err) => {

                if (err) {
                    return res.status(500).json({
                        message: 'Error deleting tracking history'
                    });
                }

                // Delete shipment
                db.query(
                    'DELETE FROM shipments WHERE shipment_id = ?',
                    [shipmentId],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                message: 'Error deleting shipment'
                            });
                        }

                        res.json({
                            message: 'Shipment deleted successfully'
                        });
                    }
                );
            }
        );
    });
});



// Get dashboard statistics
router.get('/stats', (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS total_shipments,

            SUM(CASE WHEN status = 'Booked'
                THEN 1 ELSE 0 END) AS booked,

            SUM(CASE WHEN status = 'In Transit'
                THEN 1 ELSE 0 END) AS in_transit,

            SUM(CASE WHEN status = 'Out for Delivery'
                THEN 1 ELSE 0 END) AS out_for_delivery,

            SUM(CASE WHEN status = 'Delivered'
                THEN 1 ELSE 0 END) AS delivered

        FROM shipments
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: 'Error fetching statistics'
            });
        }

        res.json(results[0]);
    });
});


module.exports = router;
