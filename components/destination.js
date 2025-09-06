import React,{useState} from 'react'
import { useGlobalState } from '../globalState'
import { DB } from '../firebaseConfig'
import DestinationAutocomplete from './destinationAutocomplete'
import { collection,addDoc} from "firebase/firestore"
import ClipLoader from "react-spinners/ClipLoader"
import { FaCaretUp } from "react-icons/fa6"
import { FaCaretDown } from "react-icons/fa6"
import { Modal } from "antd"

const Destination = () => {

  const { destinations,riders,lines} = useGlobalState()

  const [destinationNameFilter,setDestinationNameFilter] = useState('')
  const [destinationIDFilter,setDestinationIDFilter] = useState('')
  const [ridersCountSortDirection, setRidersCountSortDirection] = useState(null)
  const [lineCountSortDirection, setLineCountSortDirection] = useState(null)
  const [isOpeningAddingDestinationModal,setIsOpeningAddingDestinationModal] = useState(false)
  const [destination, setDestination] = useState('')
  const [destinationLocation, setDestinationLocation] = useState(null)
  const [newDestinationContractType,setNewDestinationContractType] = useState('')
  const [isAddingNewSchoolLoading,setIsAddingNewSchoolLoading] = useState(false)

  // Count riders for each B2B destination
  const ridersCounts = riders.reduce((acc, rider) => {
    acc[rider.destination] = (acc[rider.destination] || 0) + 1;
    return acc;
  }, {});

  // Count riders for each B2B line
  const linesCounts = lines.reduce((acc, line) => {
    acc[line.destination] = (acc[line.destination] || 0) + 1;
    return acc;
  }, {});

  // Add student count to each school
  const enrichedDestination = destinations.map((destination) => ({
    ...destination,
    ridersCounts: ridersCounts[destination.name] || 0,
    linesCount: linesCounts[destination.name] || 0,
  }));

  // Filter schools based on search term
  const filteredDestinations = enrichedDestination.filter((destination) => {
    const matchesName = destination.name.includes(destinationNameFilter)
    const mathcesID = destination.id.includes(destinationIDFilter)
    return matchesName && mathcesID
  });

  // Sort schools by student count
  const sortedDestination = filteredDestinations.sort((a, b) => {
    if (ridersCountSortDirection === 'asc') return a.ridersCounts - b.ridersCounts;
    if (ridersCountSortDirection === 'desc') return b.ridersCounts - a.ridersCounts;
    if (lineCountSortDirection === 'asc') return a.linesCount - b.linesCount;
    if (lineCountSortDirection === 'desc') return b.linesCount - a.linesCount;
    return 0;
  });

  // Handle school name change
  const handleFilterByName = (e) => {
    setDestinationNameFilter(e.target.value);
  };

  // Handle school id change
  const handleFilterByID = (e) => {
    setDestinationIDFilter(e.target.value)
  }

  // Handle sorting by highest student count
  const handleSortByHighestStudentCount = () => {
    setRidersCountSortDirection('desc');
  };

  // Handle sorting by lowest student count
  const handleSortByLowestStudentCount = () => {
    setRidersCountSortDirection('asc');
  };

  // Handle sorting by highest line count
  const handleSortByHighestLineCount = () => {
    setLineCountSortDirection('desc');
  };

  // Handle sorting by lowest line count
  const handleSortByLowestLineCount = () => {
    setLineCountSortDirection('asc');
  };

  // Open adding new school modal
  const openAddNewDestinationModal = () => {
    setIsOpeningAddingDestinationModal(true)
  }
  
  // Open adding new school modal
  const closeAddNewDestinationModal = () => {
    setIsOpeningAddingDestinationModal(false)
    setDestination('')
    setNewDestinationContractType("");
  }

  // Adding new School data
  const addNewDestinationHandler = async() => {
    if (!destination) {
      alert("يرجى إدخال الاسم");
      return;
    }

    if (!destinationLocation) {
      alert("يرجى إدخال الاحداثيات");
      return;
    }

    if (!newDestinationContractType) {
      alert("يرجى تحديد نوع الخدمة");
      return;
    }

    setIsAddingNewSchoolLoading(true)

    try {
      const newDestination = {
        name:destination,
        coords:destinationLocation,
        contract_type:newDestinationContractType
      }

      await addDoc(collection(DB, "institutions"), newDestination);
     
      closeAddNewDestinationModal()

      alert("تمت إضافة المؤسسة بنجاح");

    } catch (error) {
      console.error("Error adding new school:", error);
      alert("حدث خطأ أثناء إضافة المؤسسة. حاول مرة أخرى.");
    } finally{
      setIsAddingNewSchoolLoading(false)
      setDestination('')
      setNewDestinationContractType("");
    }
  }

  // Render add new school section
  const renderAddNewDestination = () => (
    <>
      <div className='add_new_destination_box'>
        <div className='students-section-inner-title' style={{width:'250px'}}>
          <button
            onClick={openAddNewDestinationModal}
            className='confirm-edit-time-table-button'
            style={{width:'150px'}}
          >
            اضافة مدرسة / جامعة
          </button>
        </div>
        <div className='students-section-inner-title' style={{width:'250px'}}>
          <input 
            onChange={handleFilterByID}
            value={destinationIDFilter}
            placeholder= 'المعرف الخاص' 
            type='text' 
            className='students-section-inner-title_search_input'
            style={{width:'250px',fontSize:'14px'}}
          />
        </div>
      </div>

      <Modal
        title={'مؤسسة جديدة'}
        open={isOpeningAddingDestinationModal}
        onCancel={closeAddNewDestinationModal}
        centered
        footer={null}
      >
        <div className='add_new_company_info_modal'>
          <div className='add_new_company_info_modal_form'>
            <div className='students-section-inner-title'>
              <DestinationAutocomplete
                destination={destination}
                setDestination={setDestination}
                setDestinationLocation={setDestinationLocation}
                placeholder={destination ? destination : 'الوجهة'}
              />
            </div>
            <select
              onChange={(e) => setNewDestinationContractType(e.target.value)}
              value={newDestinationContractType}
            >
              <option value=''>نوع الخدمة</option>
              <option value='app with drivers'>تطبيق مع سواق</option>
              <option value='only app'>تطبيق فقط</option>
            </select>
            {isAddingNewSchoolLoading ? (
              <div style={{ width:'120px',height:'30px',borderRadius:'10px',backgroundColor:'#955BFE',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <ClipLoader
                  color={'#fff'}
                  loading={isAddingNewSchoolLoading}
                  size={10}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
            ) : (
              <button onClick={addNewDestinationHandler}>اضف</button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )

  // Render school titles
  const renderSchoolTitles = () => (
    <div className='students-section-inner-titles'>
      <div className='students-section-inner-title' style={{width:'350px'}}>
        <input 
          onChange={handleFilterByName}
          value={destinationNameFilter}
          placeholder= 'المدرسة' 
          type='text' 
          className='students-section-inner-title_search_input'
        />
      </div>
      <div className='students-section-inner-title' style={{width:'350px'}}>
        <select
          style={{width:'250px'}}
        >
          <option value=''>نوع الخدمة</option>
          <option value=''>تطبيق مع سواق</option>
          <option value=''>تطبيق فقط</option>
        </select>
      </div>
      <div className='students-section-inner-title' style={{width:'150px'}}>
        <div className='driver-rating-box' style={{width:'100px'}}>
          <button onClick={handleSortByLowestLineCount}>
            <FaCaretDown 
              size={18} 
              className={lineCountSortDirection  === 'asc' ? 'driver-rating-box-icon-active':'driver-rating-box-icon'}/>
          </button>
          <h5>الخطوط</h5>
          <button onClick={handleSortByHighestLineCount}>
            <FaCaretUp 
              size={18}
              className={lineCountSortDirection  === 'desc' ? 'driver-rating-box-icon-active':'driver-rating-box-icon'}/>
          </button>
        </div>
      </div>
      <div className='students-section-inner-title' style={{width:'150px'}}>
        <div className='driver-rating-box' style={{width:'100px'}}>
          <button onClick={handleSortByLowestStudentCount}>
            <FaCaretDown 
              size={18} 
              className={ridersCountSortDirection === 'asc' ? 'driver-rating-box-icon-active':'driver-rating-box-icon'}/>
          </button>
          <h5>الطلاب</h5>
          <button onClick={handleSortByHighestStudentCount}>
            <FaCaretUp 
              size={18}
              className={ridersCountSortDirection === 'desc' ? 'driver-rating-box-icon-active':'driver-rating-box-icon'}/>
          </button>
        </div>
      </div>
    </div>
  )

  // Render rows 
  const renderSchoolRows = () => (
    <div className='all-items-list'>
      {sortedDestination.map((dest, index) => (
        <div key={index} className='single-item'>
          <div style={{width:'350px'}}>
            <h5>{dest.name}</h5>
          </div>
          <div style={{width:'350px'}}>
            <h5>{dest.id}</h5>
          </div>
          <div style={{width:'150px'}}>
            <h5>{dest.linesCount}</h5>
          </div>
          <div style={{width:'150px'}}>
            <h5>{dest.ridersCounts}</h5>
          </div>         
        </div>
      ))}
    </div>   
  )

  return (
    <div className='white_card-section-container'>
      <div className='students-section-inner'>
        {renderAddNewDestination()}
        {renderSchoolTitles()}
        {renderSchoolRows()}
      </div>
    </div>
  )
}

export default Destination