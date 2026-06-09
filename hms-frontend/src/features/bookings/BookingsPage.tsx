import { useEffect,useState } from 'react';
import { type BookingDto } from '../../types/booking';
import { getMyBookings } from './bookingApi';

export const BookingsPage = () => {
    const [bookings, setBookings] = useState<BookingDto[]>([]);
    const [isLoading,setIsLoading] = useState(true);
    const [error,setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setIsLoading(true);
                const data = await getMyBookings();
                setBookings(data);
            } catch (err) {
                setError('We were unable to load your booking. Please try again later');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookings();
    }, []);

    if(isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-xl font-semibold text-slate-400 animate-pulse">Loading...</div>
            </div>
        )
    }

    if(error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-200">
                {error}
            </div>
        );
    }

    return (
        <div>
            <h1 className="mb-6 text-3xl font-bold text-slate-800">My bookings</h1>

            {bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-lg text-slate-500">You don't have any bookings yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {bookings.map((booking) => (
                    <div 
                    key={booking.id} 
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {booking.status}
                        </span>
                        <span className="text-lg font-bold text-slate-700">
                            ${booking.totalPrice.toFixed(2)}
                        </span>
                        </div>
                        
                        <h3 className="mb-2 text-xl font-bold text-slate-900">
                        {booking.roomTypeName}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-400">CheckIn:</span>
                            <span>{new Date(booking.checkInDate).toLocaleDateString('uk-UA')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-400">Checkout:</span>
                            <span>{new Date(booking.checkOutDate).toLocaleDateString('uk-UA')}</span>
                        </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
                        <button className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                        Скасувати
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
};
