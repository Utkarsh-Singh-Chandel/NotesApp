import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import NoteCard from "../../components/Cards/NoteCard";
import { MdAdd } from "react-icons/md";
import AddEditNotes from "./AddEditNotes";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import axiosInstance from "../../../utils/axiosInstance";
import Toast from "../../components/ToastMessage/Toast";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddNotesImg from '../../assets/images/add-note.png'
import NoDataImg from '../../assets/images/no-data.png'
const Home = () => {
 
  const [openAndEditModal, setOpenAndEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });
  const [showToastmsg, setShowToastMsg] = useState({
    isShown: false,
    message: "",
    type: "add",
  });
  const [isSearch,setIsSearch]=useState(false);

  const [userInfo, setUserInfo] = useState(null);
  const [allNotes, setAllNotes] = useState();

  const navigate = useNavigate();
  const onSearchNote=async(query)=>{
    try {
      const response=await axiosInstance.get("/search-notes",{
        params:{query},

      });
      if(response.data && response.data.notes){
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }      
    } catch (error) {
      console.log(error);

    }
  }
  const handleClearSearch=()=>{
    setIsSearch(false);
    getAllNotes();

  }
  const handleEdit = async (noteDetails) => {
    setOpenAndEditModal({ isShown: true, data: noteDetails, type: "edit" });
  };
  const UpdateIsPinned=async(noteData)=>{
    try {
      const noteId=noteData._id;

      const response=await axiosInstance.put("/update-note-pinned/"+noteId,{
     "isPinned":!noteData.isPinned
      })
      if(response.data && response.data.note){
        showToastMessage("Note Updated successfully",'edit')
       getAllNotes();  
      }
    } catch (error) {
        console.log(error);

    }
  }
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      console.log("an error in getUserinfo ",error)
      if (error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };
  const showToastMessage = (message, type) => {
    setShowToastMsg({
      isShown: true,
      message: message,
      type: type,
    });
  };

  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: "",
    });
  };
  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get("/get-all-notes");
      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log("an error occured in getAllNotes", error);
    }
  };
  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => {};
  }, []);
  //Delete Note
  const deleteNote = async (data) => {
    const noteId = data._id;

    try {
      const response = await axiosInstance.delete(`/delete-note/${noteId}`);
      if (response.data && !response.data.error) {
        showToastMessage("Note Deleted Successfully", "delete");
        getAllNotes();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        console.log("An unexp error occured", error);
      }
    }
  };
  return (
    <>
      <Navbar userInfo={userInfo} onSearchNote={onSearchNote} 
        handleClearSearch={handleClearSearch}
      />
      <div className="container mx-auto">
        {allNotes?.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {allNotes.map((item, index) => {
              return (
                <NoteCard
                  key={item._id}
                  title={item.title}
                  date={moment(item.createdOn).format("Do MMM YYYY")}
                  content={item.content}
                  tags={item.tags}
                  isPinned={item.isPinned}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => deleteNote(item)}
                  onPinNote={() => UpdateIsPinned(item)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyCard imgSrc={isSearch?NoDataImg:AddNotesImg} message={
            isSearch?`No Note Found`:`Start creating your first note . Click on Add Note Button below to add your new note`
          } />
        )}
      </div>
      <button
        className="w-16 h-16 flex items-center
      justify-center rounded-2xl  bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
        onClick={() => {
          setOpenAndEditModal({ isShown: true, type: "add", data: null });
        }}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>
      <Modal
        className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto 
      mt-14 p-5 overflow-scroll"
        isOpen={openAndEditModal.isShown}
        ariaHideApp={false}
        onrRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
          },
        }}
        contentLabel=""
      >
        <AddEditNotes
          getAllNotes={getAllNotes}
          showToastMessage={showToastMessage}
          type={openAndEditModal.type}
          noteData={openAndEditModal.data}
          onClose={() => {
            setOpenAndEditModal({ isShown: false, type: "add", data: null });
          }}
        />
      </Modal>
      <Toast
        isShown={showToastmsg.isShown}
        message={showToastmsg.message}
        type={showToastmsg.type}
        onClose={handleCloseToast}
      />
    </>
  );
};

export default Home;
