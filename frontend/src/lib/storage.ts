import { Hotel, Room, Customer, Booking ,User} from '@/types/hotel';

const STORAGE_KEYS = {
  HOTELS: 'hotels',
  ROOMS: 'rooms',
  CUSTOMERS: 'customers',
  BOOKINGS: 'bookings',
  CURRENT_USER: 'currentUser',
  ROOM_DATE_STATUS: 'roomDateStatus',
};

// Initialize with sample data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.HOTELS)) {
    const sampleHotel: Hotel = {
      id: '1',
      name: 'Grand Plaza Hotel',
      email: 'admin@grandplaza.com',
      phone: '+91 9876543210',
      address: '123 Main Street, Mumbai, Maharashtra 400001',
      gstPercentage: 12,
      serviceChargePercentage: 10,
      adminName: 'Admin User',
      username: 'admin',
      password: 'admin123',
      createdAt: new Date().toISOString(),
      logo_image: ''
    };

    const sampleRooms: Room[] = [
      {
        id: '1',
        hotelId: '1',
        roomNumber: '101',
        roomType: 'Deluxe',
        floor: 1,
        basePrice: 3000,
        amenities: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service'],
        status: 'available',
      },
      {
        id: '2',
        hotelId: '1',
        roomNumber: '102',
        roomType: 'Standard',
        floor: 1,
        basePrice: 2000,
        amenities: ['AC', 'WiFi', 'TV'],
        status: 'available',
      },
      {
        id: '3',
        hotelId: '1',
        roomNumber: '201',
        roomType: 'Suite',
        floor: 2,
        basePrice: 5000,
        amenities: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service', 'Jacuzzi', 'Balcony'],
        status: 'available',
      },
      {
        id: '4',
        hotelId: '1',
        roomNumber: '202',
        roomType: 'Deluxe',
        floor: 2,
        basePrice: 3000,
        amenities: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service'],
        status: 'booked',
      },
      {
        id: '5',
        hotelId: '1',
        roomNumber: '301',
        roomType: 'Standard',
        floor: 3,
        basePrice: 2000,
        amenities: ['AC', 'WiFi', 'TV'],
        status: 'maintenance',
      },
    ];

    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify([sampleHotel]));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(sampleRooms));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  }
};

// Hotels
export const getHotels = (): Hotel[] => {
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEYS.HOTELS);
  return data ? JSON.parse(data) : [];
};

export const addHotel = (hotel: Hotel): void => {
  const hotels = getHotels();
  hotels.push(hotel);
  localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
};

export const updateHotel = (hotel: Hotel): void => {
  const hotels = getHotels();
  const index = hotels.findIndex(h => h.id === hotel.id);
  if (index !== -1) {
    hotels[index] = hotel;
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
  }
};

// Rooms
export const getRooms = (hotelId?: string): Room[] => {
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
  const rooms: Room[] = data ? JSON.parse(data) : [];
  return hotelId ? rooms.filter(r => r.hotelId === hotelId) : rooms;
};

export const addRoom = (room: Room): void => {
  const rooms = getRooms();
  rooms.push(room);
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
};

export const updateRoom = (room: Room): void => {
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.id === room.id);
  if (index !== -1) {
    rooms[index] = room;
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }
};

export const deleteRoom = (roomId: string): void => {
  const rooms = getRooms();
  const filtered = rooms.filter(r => r.id !== roomId);
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(filtered));
};

// Customers
export const getCustomers = (hotelId?: string): Customer[] => {
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  const customers: Customer[] = data ? JSON.parse(data) : [];
  return hotelId ? customers.filter(c => c.hotelId === hotelId) : customers;
};

export const addCustomer = (customer: Customer): void => {
  const customers = getCustomers();
  customers.push(customer);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const updateCustomer = (customer: Customer): void => {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index !== -1) {
    customers[index] = customer;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }
};

// Bookings
export const getBookings = (hotelId?: string): Booking[] => {
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  const bookings: Booking[] = data ? JSON.parse(data) : [];
  return hotelId ? bookings.filter(b => b.hotelId === hotelId) : bookings;
};

export const addBooking = (booking: Booking): void => {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
};

export const updateBooking = (booking: Booking): void => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === booking.id);
  if (index !== -1) {
    bookings[index] = booking;
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
};

export const cancelBooking = (bookingId: string): void => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = 'cancelled';
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
};

// Current User
export const getCurrentUser = (): Hotel | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (hotel: Hotel | null): void => {
  if (hotel) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(hotel));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const logout = (): void => {
  setCurrentUser(null);
};

// Check for booking conflicts
export const hasBookingConflict = (
  roomId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): boolean => {
  const bookings = getBookings();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return bookings.some(booking => {
    if (booking.roomId !== roomId || booking.status === 'cancelled') return false;
    if (excludeBookingId && booking.id === excludeBookingId) return false;

    const bookingCheckIn = new Date(booking.checkInDate);
    const bookingCheckOut = new Date(booking.checkOutDate);

    return (
      (checkInDate >= bookingCheckIn && checkInDate < bookingCheckOut) ||
      (checkOutDate > bookingCheckIn && checkOutDate <= bookingCheckOut) ||
      (checkInDate <= bookingCheckIn && checkOutDate >= bookingCheckOut)
    );
  });
};

// Room Date Status Management
export interface RoomDateStatus {
  roomId: string;
  date: string;
  status: 'blocked' | 'maintenance';
}

export const getRoomDateStatuses = (): RoomDateStatus[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROOM_DATE_STATUS);
  return data ? JSON.parse(data) : [];
};

export const setRoomDateStatus = (roomId: string, date: string, status: 'blocked' | 'maintenance'): void => {
  const statuses = getRoomDateStatuses();
  const existing = statuses.findIndex(s => s.roomId === roomId && s.date === date);
  
  if (existing !== -1) {
    statuses[existing].status = status;
  } else {
    statuses.push({ roomId, date, status });
  }
  
  localStorage.setItem(STORAGE_KEYS.ROOM_DATE_STATUS, JSON.stringify(statuses));
};

export const clearRoomDateStatus = (roomId: string, date: string): void => {
  const statuses = getRoomDateStatuses();
  const filtered = statuses.filter(s => !(s.roomId === roomId && s.date === date));
  localStorage.setItem(STORAGE_KEYS.ROOM_DATE_STATUS, JSON.stringify(filtered));
};

export const getRoomDateStatus = (roomId: string, date: string): 'blocked' | 'maintenance' | null => {
  const statuses = getRoomDateStatuses();
  const status = statuses.find(s => s.roomId === roomId && s.date === date);
  return status ? status.status : null;
};
