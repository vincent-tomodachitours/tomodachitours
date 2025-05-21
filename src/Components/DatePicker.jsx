import { useEffect, useState } from "react"
import Calendar from "react-calendar"
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";
import { ReactComponent as Clock } from '../SVG/Clock.svg'
import Checkout from './Checkout'

function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price }) {
    const [checkout, setCheckout] = useState(false);
    const handleOpenCheckout = () => setCheckout(true);
    const handleCloseCheckout = () => setCheckout(false);
    const [bookings, setBookings] = useState("Loading");

    const [loaded, setLoaded] = useState(0);
    const [calendarState, setCalendarState] = useState(0);

    const [participants, setParticipants] = useState(1);

    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);

    const totalPrice = (adultParticipants + childParticipants) * price;

    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const handleTourTimeChange = (event) => {
        setTourTime(event.target.value);
    }

    useEffect(() => {
        fetchBookings();
    }, [sheetId]);

    useEffect(() => {
        if (calendarState === 1) {
            setTourTime(returnAvailableTimes(calendarSelectedDate, participants)[0])
        }
    }, [calendarState])

    useEffect(() => {
        const appContainer = document.getElementById('app-container');
        if (checkout) {
            appContainer.classList.remove('overflow-y-auto');
            appContainer.classList.add('overflow-y-hidden');
        } else {
            appContainer.classList.remove('overflow-y-hidden');
            appContainer.classList.add('overflow-y-auto');
        }

        return () => {
            appContainer.classList.remove('overflow-y-hidden');
        };
    }, [checkout]);

    //Depricated fetch bookings api call straight to google app script: insecure
    /**const fetchFakeBookings = async () => {
        try {
            const sheetUrl = `${api}?action=getBookings`;

            const response = await fetch('sheetUrl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetUrl })
            });

            const data = await response.json();
            console.log(data);
            setBookings(data);
            setLoaded(1);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        }
    };*/

    const fetchBookings = async () => {
        try {
            const response = await fetch('https://us-central1-tomodachitours-f4612.cloudfunctions.net/getBookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spreadsheetId: "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM",
                    range: `${sheetId}!A2:I`
                })
            });

            const data = await response.json();
            setBookings(data.values);
            setLoaded(1);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        }
    };

    const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    const today = new Date();

    const oneYearsLater = new Date();
    oneYearsLater.setFullYear(today.getFullYear() + 1);

    const minViewLimit = new Date();
    minViewLimit.setMonth(today.getMonth());

    const participantsByDate = {};
    Object.values(bookings).forEach((b) => {
        if (b[0] && b[1]) {
            const formattedDate = b[0].split("T")[0];
            const timeSlot = b[1];

            // Initialize date entry if it doesn't exist
            if (!participantsByDate[formattedDate]) {
                participantsByDate[formattedDate] = {};
            }
            // Ensure all time slots exist for that date (set to 0 by default)
            availableTimes.forEach((t) => {
                if (!participantsByDate[formattedDate][t]) {
                    participantsByDate[formattedDate][t] = 0;
                }
            });

            participantsByDate[formattedDate][timeSlot] += b[8];
        }
    });

    //Depricated fetched booking organizing logic(using google app scripts): insecure
    //If using this logic and you run into an error, check the date format coming from the api
    /**Object.values(bookings).forEach((b) => {
        if (b["date"] && b["time"]) {
            const formattedDate = b["date"].split("T")[0];
            const timeSlot = b["time"];

            // Initialize date entry if it doesn't exist
            if (!participantsByDate[formattedDate]) {
                participantsByDate[formattedDate] = {};
            }
            // Ensure all time slots exist for that date (set to 0 by default)
            availableTimes.forEach((t) => {
                if (!participantsByDate[formattedDate][t]) {
                    participantsByDate[formattedDate][t] = 0;
                }
            });

            participantsByDate[formattedDate][timeSlot] += b["participants"];
        }
    });*/

    const returnAvailableTimes = (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate];

        const options = [...availableTimes];

        if (dayData) {
            for (let i = 0; i < options.length; i++) {
                if (dayData[options[i]] > (maxSlots - participants)) {
                    options.splice(i, 1);
                    i--;
                }
            }
        }

        return options;
    }

    const timeSlotSelector = (options) => {
        return <div>
            <select name="time" id="time" value={tourTime} onChange={handleTourTimeChange} className="w-full h-10 rounded-lg border border-gray-700 bg-slate-100 px-2 font-ubuntu font-bold">
                {options.map((_, i) => (
                    <option value={options[i]}>
                        {options[i]}
                    </option>
                ))}
            </select>
        </div>
    }

    const isDateFull = (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate];

        if (!dayData) return false;

        for (let i = 0; i < availableTimes.length; i++) {
            if (dayData[availableTimes[i]] < (maxSlots - participants)) {
                return false;
            }
        }

        return true;
    };


    const disableDates = ({ date }) => {
        return date < today || isDateFull(date, participants);
    }

    function onCalendarChange(nextValue) {
        setCalendarSelectedDate(nextValue);
        setCalendarState(1);
    }

    const renderCalendarComponent = () => {
        if (calendarState === 0) {
            return <div>
                <div className="mb-8">
                    <h1 className='font-ubuntu font-black text-2xl'>Who's going?</h1>
                    <PeopleSelector min={1} max={maxSlots} title={"Adult"} participants={participants} setParticipants={setParticipants} value={adultParticipants} onChange={setAdultParticipants} />
                    <PeopleSelector min={0} max={maxSlots} title={"Child"} participants={participants} setParticipants={setParticipants} value={childParticipants} onChange={setChildParticipants} />
                    <PeopleSelector min={0} max={maxSlots} title={"Infant"} participants={participants} setParticipants={setParticipants} value={infantParticipants} onChange={setInfantParticipants} />
                </div>
                <h1 className='font-ubuntu font-black text-2xl my-4'>Choose a date</h1>
                <Calendar
                    tileDisabled={disableDates}
                    onChange={onCalendarChange}
                    value={calendarSelectedDate}
                    next2Label={null}
                    prev2Label={null}
                    maxDate={oneYearsLater}
                    minDate={minViewLimit}
                />
                {/** 
                <p className="font-ubuntu font-bold text-md h-full mt-4">{maxSlots - checkParticipants(calendarSelectedDate) > 0 ? maxSlots - checkParticipants(calendarSelectedDate) : 0} slots left</p>
                 * **/}
            </div>
        } else if (calendarState === 1) {
            return <div className="time-selection">
                <h1 className='font-ubuntu font-black text-2xl'>{calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</h1>
                <br />
                <div className="flex items-center mb-2">
                    <Clock className='w-6 h-6 text-gray-700 mr-2' />
                    <h2 className="font-ubuntu font-black text-lg">Choose a time</h2>
                </div>
                {
                    timeSlotSelector(returnAvailableTimes(calendarSelectedDate, participants))
                }
                <div className="mt-6 booking-summary">
                    <h1 className='font-ubuntu font-black text-2xl my-4'>Booking Summary</h1>
                    <div className="w-full flex justify-between">
                        <h2 className="font-ubuntu font-black text-lg">{tourName}</h2>
                        <div className="w-full text-right">
                            <span className="font-ubuntu font-extrabold text-blue-700 text-2xl">{tourTime}</span><br />
                            <span className="font-ubuntu font-extrabold text-blue-700 text-md">{calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                    </div>
                    <div className="flex w-full my-4">
                        <div>
                            <span>Adults: {adultParticipants}</span>
                            {childParticipants !== 0 ?
                                <div>
                                    <span>Children: {childParticipants}</span>
                                </div> : null}
                            {infantParticipants !== 0 ?
                                <div>
                                    <span>Infants: {infantParticipants}</span>
                                </div> : null
                            }
                        </div>
                        <div className="ml-auto mt-auto text-black">
                            <span>Total (¥): </span>
                            <span>{totalPrice}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => { setCalendarState(0) }}>&lt; Go back</button>
                <button className="w-full h-12 mt-4 bg-blue-700 rounded-md  text-white font-ubuntu" onClick={handleOpenCheckout}>Checkout</button>
            </div>
        }
    }

    return (
        <div className='w-full md:w-2/3 lg:w-2/5 h-full border border-gray-300 rounded-md p-4 mx-auto text-gray-700'>
            {loaded ? (
                <div>
                    {renderCalendarComponent()}
                </div>
            ) : (
                <div className="w-full h-full grid place-content-center">
                    <h1 className="text-3xl font-ubuntu font-bold">LOADING...</h1>
                </div>
            )}
            {checkout === true ? (
                <Checkout onClose={handleCloseCheckout} tourName={tourName} tourDate={calendarSelectedDate.toLocaleDateString("en-CA")} tourTime={tourTime} adult={adultParticipants} child={childParticipants} infant={infantParticipants} tourPrice={price} />
            ) : null}
        </div>
    )
}

export default DatePicker