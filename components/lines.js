"use client";

import React, { useState, useMemo } from "react";
import { query, collection, orderBy, limit, getDocs,addDoc } from "firebase/firestore";
import { DB } from "../firebaseConfig";
import { useGlobalState } from "../globalState";
import ClipLoader from "react-spinners/ClipLoader";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import "../app/style.css";

const Lines = () => {
  const { lines, schools, loading } = useGlobalState();
  const router = useRouter();

  const [nameFilter, setNameFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);

  // ✅ Filter + Sort
  const filteredLines = useMemo(() => {
  const filtered = lines.filter((line) => {
    if (nameFilter && !line.line_number?.includes(nameFilter)) return false;
    if (schoolFilter !== "all" && line.school_id !== schoolFilter) return false;

    if (driverFilter === "yes" && !line.driver_id) return false;
    if (driverFilter === "no" && line.driver_id) return false;

    return true;
  });

  // ✅ SORT BY LINE NUMBER
  return filtered.sort((a, b) => {
    const numA = parseInt(a.line_number?.replace("L", "")) || 0;
    const numB = parseInt(b.line_number?.replace("L", "")) || 0;
    return numA - numB;
  });
}, [lines, nameFilter, schoolFilter, driverFilter]);

  const openCreateModal = () => setOpenModal(true);

  const closeCreateModal = () => {
    setOpenModal(false);
  };

  //Get next line number
  const getNextLineNumber = async () => {
    const q = query(
      collection(DB, "lines"),
      orderBy("line_number", "desc"),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) return "L001";

    const last = snap.docs[0].data().line_number;
    const number = parseInt(last.replace("L", ""));

    const next = number + 1;

    return `L${String(next).padStart(3, "0")}`;
  };

  //Create new line
  const handleCreateLine = async () => {
    if (!selectedSchool) {
      alert("يرجى اختيار المدرسة");
      return;
    }

    try {
      setLoadingCreate(true);

      // ✅ Find selected school
      const school = schools.find((s) => s.id === selectedSchool);

      if (!school) {
        alert("خطأ في اختيار المدرسة");
        return;
      }

      const formattedNumber = await getNextLineNumber();

      // ✅ Create doc
      await addDoc(collection(DB, "lines"), {
        line_number: formattedNumber,
        destination: school.name,
        destination_location: school.location || null,
        school_id: school.id,
        driver_id: null,
        driver_name: null,
        car_type: null,
        riders: [],
        created_at: new Date(),
      });

      alert(`تم إنشاء الخط ${formattedNumber} ✅`);

      // reset
      setSelectedSchool("");
      closeCreateModal();

    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إنشاء الخط");
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="lines-container">
      <div className="schools-header">
        <h2>الخطوط</h2>

        <div className="create-btn" onClick={openCreateModal}>
          <p>+ إنشاء خط جديد</p>
        </div>
      </div>

      <Modal
        title="إنشاء خط جديد"
        open={openModal}
        onCancel={closeCreateModal}
        footer={null}
        centered
      >
        <div className="create-school-form">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">اختر المدرسة</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {loadingCreate ? (
            <div className="btn-loading">
              <ClipLoader size={15} color="#fff" />
            </div>
          ) : (
            <button className="create-submit" onClick={handleCreateLine}>
             إنشاء
            </button>
          )}
        </div>
      </Modal>

      {/* Filter */}
      <div className="lines-filters">
        <input
          placeholder="البحث برقم الخط..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="all">كل المدارس</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="all">السائق</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
      </div>

      {/* Table */}
      <div className="lines-table">

        <div className="lines-table-header">
          <span>رقم الخط</span>
          <span>الوجهة</span>
          <span>السائق</span>
          <span>عدد الطلاب</span>
        </div>

        {loading ? (
          <div className="loader">
            <ClipLoader size={30} color="#3b82f6" />
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="empty">لا يوجد خطوط</div>
        ) : (
          filteredLines.map((line) => (
            <div 
              key={line.id} 
              className="lines-table-row"
              onClick={() => router.push(`/lines/${line.id}`)}
            >
              <span>{line.line_number}</span>
              <span>{line.destination || "-"}</span>
              <span>{line.driver_id || "-"}</span>
              <span>{line.riders.length || 0}</span>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default Lines;