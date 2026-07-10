//Main work:- making responsive seating
document.addEventListener('DOMContentLoaded',()=>{
    const API_URL='http://localhost:3000'; // API ka base address
    const SEAT_PRICE=250; // Ek seat ka fixed daam

    //DOM 
    const titleEl=document.getElementById('movie-title');
    const infoEl=document.getElementById('showtime-info');
    const backLnk=document.getElementById('back-link');
    const seatArea=document.querySelector('.seats-area');
    const statEl=document.getElementById('seat-status-area'); // Status message dikhane ki jagah
    const selListEl=document.getElementById('selected-seats-list');
    const priceEl=document.getElementById('total-price');
    const confBtn=document.getElementById('confirm-booking-btn');
    const contEl=document.querySelector('.seating-container');

    //fetching data from url
    const prms=new URLSearchParams(window.location.search);
    const mId=prms.get('movieId');
    const tId=prms.get('theaterId');
    const date=prms.get('date');
    const slot=prms.get('slot');
    const lang=prms.get('lang');
    const fmt=prms.get('format');
    const mTitle=prms.get('movieTitle')?decodeURIComponent(prms.get('movieTitle')):'Movie';
    const tName=prms.get('theaterName')?decodeURIComponent(prms.get('theaterName')):'Theater';

    let selSeats=[];
    let occSeats=[];

    // initalizing the page
    async function init(){
        // info
        titleEl.textContent=mTitle;
        infoEl.textContent=`${tName} | ${date} | ${slot}`;
        if(mId){
            backLnk.href=`movie-details.html?id=${mId}`; // Back button ka link set karo
            backLnk.style.display='inline-block';
        }

        // fetching booked seat
        await getOccSeats(mId,tId,date,slot);

        // Seat Matrix dikhao screen pe
        rendSeats(); // Fetch hone ke baad map dikhao

        // Neeche summary update karo
        updSum();
    }

    // Backend se Booked Seats Fetching
    async function getOccSeats(mId,tId,dt,sl){
         showLoad("Loading seat availability...",statEl);
         try{
              // API request
              const qPrms=new URLSearchParams({movieId:mId,theaterId:tId,bookingDate:dt,showtimeSlot:sl});
              const res=await fetch(`${API_URL}/api/bookings/occupied-seats?${qPrms.toString()}`);
              // for false response
              if(!res.ok){
                  const errData=await res.json().catch(()=>({message:res.statusText})); // Error message nikalne ki koshish karo
                  throw new Error(`Failed to fetch occupied seats (${res.status}): ${errData.message}`);
              }
              // Response se booked seats ka array le lo
              occSeats=await res.json();
              console.log("Occupied Seats Fetched:",occSeats);
              statEl.innerHTML=''; // to remove status msg

         }catch(err){
              // fpr error handling
              console.error("Error fetching occupied seats:",err);
              showErr(`Error loading seat availability: ${err.message}.`,statEl);
              occSeats=[]; // Error aaya toh booked seats ko bhool jao
              // Confirm button disable
              confBtn.disabled=true;
              confBtn.textContent='Seat Status Unavailable';
         }
    }

    //Seat Map Screen Pe Dikhao
    function rendSeats(){
        const allSeatsEl=seatArea.querySelectorAll('.seat');
        const loadMsgEl=statEl.querySelector('.loading-message'); 
        if(loadMsgEl)loadMsgEl.remove(); // handling loading dikhne
        const errMsgEl=statEl.querySelector('.error-message'); // Error message check karo

        // Agar seats hi nahi mili HTML mein toh error 
        if(!allSeatsEl||allSeatsEl.length===0){
            console.error("Seat elements not found in .seats-area! Check seating.html.");
            if(!errMsgEl)showErr("Failed to find seat map elements in HTML.",statEl); // HTML mein seats hi nahi mili!
            return;
        }
        // Koi error nahiSt atus area saaf
        if(!errMsgEl)statEl.innerHTML='';

        // checking seat individually
        allSeatsEl.forEach(st=>{
            const sId=st.dataset.seatId;
            st.removeEventListener('click',onSeatClk);
            st.classList.remove('occupied','selected','available');

            // checking
            if(occSeats.includes(sId)){
                st.classList.add('occupied'); // Booked hai toh 'occupied' style lagao
            }else{
                // Seat khaali hai toh...
                st.classList.add('available'); // 'available' style lagao
                st.addEventListener('click',onSeatClk); // Click pe function chalane ka listener add karo
            }
        });
    }


    //Event Handlers for clicking
    function onSeatClk(ev){ // Jab koi seat pe click kare
        const st=ev.currentTarget; // Jis seat pe click ho
        const sId=st.dataset.seatId; // Id
        if(st.classList.contains('occupied'))return;
        st.classList.toggle('selected');
        if(st.classList.contains('selected')){selSeats.push(sId);}
        else{selSeats=selSeats.filter(id=>id!==sId);}

        selSeats.sort();
        updSum();
    }
    // Confirm button
    confBtn.addEventListener('click',confBook);

    //Summary
    function updSum(){
       //showing name of selected seat
        selListEl.textContent=selSeats.length===0?'None':selSeats.join(', ');
        // Poora paisa calculate karo
        const total=selSeats.length*SEAT_PRICE;
        priceEl.textContent=total; // Total price

        //making responsive button
        if(confBtn.textContent==='Booked!'||confBtn.textContent==='Seat Status Unavailable'){
             confBtn.disabled=true; // if booked or error
        }else{
             // Agar seat select ki hai toh enable, warna disable
             confBtn.disabled=selSeats.length===0;
             confBtn.textContent='Confirm Booking';
        }
    }

    //booking-confirmation page
    async function confBook(){
        if(selSeats.length===0){
            alert("Please select at least one seat.");
            return;
        }
        const uId=localStorage.getItem('userId');
        if(!uId){
            alert("Error: User not identified. Please log in again."); // User logged in nahi hai shayad
            return;
        }
        // making booking data ready
        const bkData={userId:uId,movieId:mId,theaterId:tId,language:lang,format:fmt,bookingDate:date,showtimeSlot:slot,seats:selSeats,totalPrice:selSeats.length*SEAT_PRICE};
        console.log("Sending Booking Data:",bkData);
        try{
            // Button ka text badlo aur disable karo jab tak response na aaye
            confBtn.textContent='Booking...';confBtn.disabled=true;
            // Backend ko booking request bhejo (POST request)
            const res=await fetch(`${API_URL}/api/bookings`,{
                method:'POST',headers:{'Content-Type':'application/json'}, // Batao ki JSON bhej rahe hain
                body:JSON.stringify(bkData) // Data ko JSON 
            });
            const rslt=await res.json();
            if(!res.ok)throw new Error(rslt.message||`Booking failed (${res.status})`);
            alert(`Booking Successful!\nRedirecting to your ticket page...`); // User ko batao
            window.location.href=`ticket.html?bookingId=${rslt.bookingId}`;

        }catch(err){
            // --- Booking fail ho gayi :( ---
            console.error("Booking failed:",err);
            alert(`Booking failed: ${err.message}`); // Error message
            // changing of button to confirm one
            confBtn.textContent='Confirm Booking';
            // Agar seat select nahi toh button disable showing
            confBtn.disabled=(selSeats.length===0);

            // if once booked
            if(err.message&&err.message.includes("no longer available")){
                 console.log("Conflict detected, re-fetching occupied seats...");
                 await getOccSeats(mId,tId,date,slot); 
                 rendSeats(); 
                 selSeats=[];updSum();
            }
        }
    }

     //Helper Functions
     function showLoad(msg,cont){if(cont)cont.innerHTML=`<p class="loading-message">${msg}</p>`;} // Loading message dikhane ke liye
     function showErr(msg,cont){if(cont)cont.innerHTML=`<p class="error-message">${msg}</p>`;} // Error message dikhane ke liye

    //
    // checking all details in url
    if(mId&&tId&&date&&slot&&lang&&fmt){
        init(); //if okay open 
    }else{
        showErr("Error: Missing necessary booking information in the URL.",contEl);
        console.error("Missing URL parameters for seating page:",{mId,tId,date,slot,lang,fmt});
    }

});