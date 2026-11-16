import { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total_shipments: 0,
    booked: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0
  });

  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    weight: ''
  });



  const [bookingMessage, setBookingMessage] = useState('');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');

  const [statusData, setStatusData] = useState({
    trackingNumber: '',
    status: 'In Transit',
    location: '',
    remarks: ''
  });

  const [statusMessage, setStatusMessage] = useState('');


  const [allShipments, setAllShipments] = useState([]);
  const [showShipments, setShowShipments] = useState(false);

  const trackShipment = async () => {

    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      setShipment(null);
      return;
    }

    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/shipments/track/${encodeURIComponent(trackingNumber.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setShipment(data.shipment);
      setHistory(data.tracking_history);

    } catch (err) {
      setError(err.message || 'Something went wrong');
    }

    setLoading(false);
  };


  const handleBooking = async (e) => {
    e.preventDefault();

    setBookingMessage('');
    setNewTrackingNumber('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/shipments/add',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setBookingMessage(data.message);
      setNewTrackingNumber(data.trackingNumber);

      setFormData({
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        weight: ''
      });

    } catch (error) {
      setBookingMessage(error.message);
    }
  };


  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    setStatusMessage('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/shipments/update-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(statusData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setStatusMessage(data.message);

      setStatusData({
        trackingNumber: '',
        status: 'In Transit',
        location: '',
        remarks: ''
      });

    } catch (error) {
      setStatusMessage(error.message);
    }
  };


  const fetchAllShipments = async () => {

    try {
      const response = await fetch(
        'http://localhost:5000/api/shipments/all'
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setAllShipments(data);
      setShowShipments(true);

    } catch (error) {
      alert(error.message);
    }
  };


  const deleteShipment = async (trackingNumber) => {

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this shipment?'
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/shipments/delete/${encodeURIComponent(trackingNumber)}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(data.message);

      fetchAllShipments();

    } catch (error) {
      alert(error.message);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/shipments/stats'
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }

    } catch (error) {
      console.log('Error fetching statistics:', error);
    }
  };


  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>


      <nav className="navbar">
        <h2>QuickCourier</h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#track">Track Shipment</a>
          <a href="#add-shipment">Add Shipment</a>
          <a href="#update-status">Update Status</a>
          <a href="#all-shipments">View Shipments</a>
          <a href="#about">About</a>
        </div>
      </nav>



      <section className="dashboard" id="dashboard">

        <h2>Shipment Dashboard</h2>

        <div className="dashboard-container">

          <div className="dashboard-card">
            <h3>Total Shipments</h3>
            <p>{stats.total_shipments}</p>
          </div>

          <div className="dashboard-card">
            <h3>Booked</h3>
            <p>{stats.booked}</p>
          </div>

          <div className="dashboard-card">
            <h3>In Transit</h3>
            <p>{stats.in_transit}</p>
          </div>

          <div className="dashboard-card">
            <h3>Out for Delivery</h3>
            <p>{stats.out_for_delivery}</p>
          </div>

          <div className="dashboard-card">
            <h3>Delivered</h3>
            <p>{stats.delivered}</p>
          </div>

        </div>

      </section>


      <section className="hero" id="home">

        <div className="hero-content">

          <h1>Track Your Shipment</h1>

          <p>
            Fast, reliable and secure courier delivery.
            Track your package anytime, anywhere.
          </p>

          <div className="tracking-box" id="track">

            <input
              type="text"
              placeholder="Enter your Tracking ID"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trackShipment();
              }}
            />

            <button onClick={trackShipment} disabled={loading}>
              {loading ? 'Searching...' : 'Track Now'}
            </button>

          </div>

        </div>

      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {shipment && (
        <section className="result-section">

          <h2>Shipment Details</h2>

          <div className="shipment-card">

            <p>
              <strong>Tracking ID:</strong>
              {shipment.tracking_number}
            </p>

            <p>
              <strong>Sender:</strong>
              {shipment.sender_name}
            </p>

            <p>
              <strong>Receiver:</strong>
              {shipment.receiver_name}
            </p>

            <p>
              <strong>Sender Address:</strong>
              {shipment.sender_address}
            </p>

            <p>
              <strong>Receiver Address:</strong>
              {shipment.receiver_address}
            </p>

            <p>
              <strong>Shipment Date:</strong>
              {new Date(shipment.shipment_date).toLocaleDateString()}
            </p>

            <p>
              <strong>Expected Delivery:</strong>
              {shipment.expected_delivery
                ? new Date(shipment.expected_delivery).toLocaleDateString()
                : 'Not available'}
            </p>

            <p>
              <strong>Weight:</strong>
              {shipment.weight} kg
            </p>

            <p>
              <strong>Current Status:</strong>
              <span className="status">
                {shipment.status}
              </span>
            </p>

          </div>

          <h2>Tracking History</h2>

          <div className="history-card">

            {history.map((item, index) => (
              <div className="history-item" key={index}>

                <h3>{item.status}</h3>

                <p>Location: {item.location}</p>

                <p>{item.remarks}</p>

                <small>
                  {new Date(item.updated_at).toLocaleString()}
                </small>

              </div>
            ))}

          </div>

        </section>
      )}


      <section className="add-shipment" id="add-shipment">

        <h2>Book a New Shipment</h2>

        <form onSubmit={handleBooking}>

          <h3>Sender Details</h3>

          <input
            type="text"
            placeholder="Sender Name"
            required
            value={formData.senderName}
            onChange={(e) => setFormData({
              ...formData,
              senderName: e.target.value
            })}
          />

          <input
            type="tel"
            placeholder="Sender Phone"
            required
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
            value={formData.senderPhone}
            onChange={(e) => setFormData({
              ...formData,
              senderPhone: e.target.value
            })}
          />

          <textarea
            placeholder="Sender Address"
            required
            value={formData.senderAddress}
            onChange={(e) => setFormData({
              ...formData,
              senderAddress: e.target.value
            })}
          />

          <h3>Receiver Details</h3>

          <input
            type="text"
            placeholder="Receiver Name"
            required
            value={formData.receiverName}
            onChange={(e) => setFormData({
              ...formData,
              receiverName: e.target.value
            })}
          />

          <input
            type="tel"
            placeholder="Receiver Phone"
            required
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
            value={formData.receiverPhone}
            onChange={(e) => setFormData({
              ...formData,
              receiverPhone: e.target.value
            })}
          />

          <textarea
            placeholder="Receiver Address"
            required
            value={formData.receiverAddress}
            onChange={(e) => setFormData({
              ...formData,
              receiverAddress: e.target.value
            })}
          />

          <h3>Package Details</h3>

          <input
            type="number"
            placeholder="Weight (kg)"
            min="0.01"
            step="0.01"
            required
            value={formData.weight}
            onChange={(e) => setFormData({
              ...formData,
              weight: e.target.value
            })}
          />

          <button type="submit">
            Book Shipment
          </button>

        </form>

        {bookingMessage && (
          <div className="booking-message">
            <p>{bookingMessage}</p>

            {newTrackingNumber && (
              <h3>Tracking ID: {newTrackingNumber}</h3>
            )}
          </div>
        )}

      </section>



      <section className="add-shipment" id="update-status">

        <h2>Update Shipment Status</h2>

        <form onSubmit={handleStatusUpdate}>

          <input
            type="text"
            placeholder="Enter Tracking ID"
            required
            value={statusData.trackingNumber}
            onChange={(e) => setStatusData({
              ...statusData,
              trackingNumber: e.target.value
            })}
          />

          <select
            value={statusData.status}
            onChange={(e) => setStatusData({
              ...statusData,
              status: e.target.value
            })}
          >
            <option value="Booked">Booked</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>

          <input
            type="text"
            placeholder="Current Location"
            required
            value={statusData.location}
            onChange={(e) => setStatusData({
              ...statusData,
              location: e.target.value
            })}
          />

          <textarea
            placeholder="Remarks (Optional)"
            value={statusData.remarks}
            onChange={(e) => setStatusData({
              ...statusData,
              remarks: e.target.value
            })}
          />

          <button type="submit">
            Update Status
          </button>

        </form>

        {statusMessage && (
          <div className="booking-message">
            {statusMessage}
          </div>
        )}

      </section>



      <section className="all-shipments" id="all-shipments">

        <h2>All Shipments</h2>

        <button onClick={fetchAllShipments}>
          View All Shipments
        </button>

        {showShipments && (

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {allShipments.length > 0 ? (

                  allShipments.map((item) => (

                    <tr key={item.shipment_id}>
                      <td>{item.tracking_number}</td>
                      <td>{item.sender_name}</td>
                      <td>{item.receiver_name}</td>
                      <td>
                        {new Date(item.shipment_date).toLocaleDateString()}
                      </td>
                      <td>{item.weight} kg</td>
                      <td>{item.status}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => deleteShipment(item.tracking_number)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                  ))

                ) : (

                  <tr>
                    <td colSpan="7">No shipments found</td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      <section className="features" id="about">

        <h2>Why Choose QuickCourier?</h2>

        <div className="feature-container">

          <div className="feature-card">
            <h3>Fast Delivery</h3>
            <p>We deliver your packages on time.</p>
          </div>

          <div className="feature-card">
            <h3>Easy Tracking</h3>
            <p>Track your shipment with a tracking ID.</p>
          </div>

          <div className="feature-card">
            <h3>Secure Shipping</h3>
            <p>Your packages are handled with care.</p>
          </div>

        </div>

      </section>

      <footer>
        <p>© 2026 QuickCourier. All rights reserved.</p>
      </footer>

    </div>
  );
}


export default App;
