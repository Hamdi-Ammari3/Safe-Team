"use client";

import React, { useMemo,useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection,query,where,getDocs,doc,runTransaction,serverTimestamp } from "firebase/firestore";
import { DB } from "../../../firebaseConfig";
import {useGlobalState} from '../../../globalState';
import { Modal } from "antd";
import ClipLoader from "react-spinners/ClipLoader";
import { IoArrowBackCircle } from "react-icons/io5";
import "../../style.css";

const SchoolDetails = () => {
    const { id } = useParams();
    const router = useRouter();
    const { schools, employees, loading } = useGlobalState();

    const [openOwnerModal, setOpenOwnerModal] = useState(false);
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [loadingOwner, setLoadingOwner] = useState(false);

    const school = schools.find((s) => s.id === id);

    // ✅ Group employees by job_title
    const groupedEmployees = useMemo(() => {
        if (!employees || !school) return {};

        const order = [
            "المشرف العام",
            "المدير",
            "مدير الحسابات",
            "محاسب",
            "موظف معاون",
        ];

        const grouped = {};

        order.forEach((title) => {
            grouped[title] = employees.filter(
                (e) => e.school_id === id && e.job_title === title
            );
        });

        return grouped;
    }, [employees, id, school]);

    //Generate owner doc password
    const generatePassword = (length = 8) => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return password;
    };

    // 📱 Normalize phone based on country
    const normalizePhoneByCountry = (phone, country) => {
        let cleaned = phone.replace(/\D/g, "");

        // 🇮🇶 IRAQ
        if (country === "iraq") {
            if (cleaned.startsWith("07")) {
                cleaned = cleaned.slice(1);
            }

            if (!cleaned.startsWith("7")) return null;
            if (cleaned.length !== 10) return null;

            return cleaned;
        }

        // 🇹🇳 TUNISIA
        if (country === "tunisia") {
            if (cleaned.length !== 8) return null;

            return cleaned;
        }

        return null;
    };

    //Create new owner doc
    const handleAddOwner = async () => {
        if (!ownerName || !ownerPhone) {
            alert("يرجى ملء جميع الحقول");
            return;
        }

        // ✅ Normalize phone
        const normalizedPhone = normalizePhoneByCountry(ownerPhone, school.country);

        if (!normalizedPhone) {
            if (school.country === "iraq") {
                alert("رقم الهاتف غير صالح (يجب أن يبدأ بـ 7 ويكون 10 أرقام)");
            } else if (school.country === "tunisia") {
                alert("رقم الهاتف غير صالح (يجب أن يكون 8 أرقام)");
            }
            return;
        }

        try {
            setLoadingOwner(true);

            const password = generatePassword();

            //Check phone uniqueness
            const q = query(
                collection(DB, "employees"),
                where("phone_number", "==", normalizedPhone)
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
                alert('رقم الهاتف مستخدم الرجاء ادخال رقم اخر');
                return
            }

            await runTransaction(DB, async (transaction) => {
                const employeeRef = doc(collection(DB, "employees"));

                transaction.set(employeeRef, {
                    name: ownerName,
                    phone_number: normalizedPhone,
                    username:normalizedPhone,
                    password,
                    school_id: school.id,
                    job_title: "المشرف العام",
                    country: school.country,
                    is_active: true,
                    account_deleted: false,
                    created_at: serverTimestamp(),
                });

                // create school admin
                const adminRef = doc(DB, "schoolAdmins", normalizedPhone);

                transaction.set(adminRef, {
                    admin_id: employeeRef.id,
                    name: ownerName,
                    username: normalizedPhone,
                    password,
                    role: "admin",
                    job_title: "المشرف العام",
                    school: school.name,
                    school_id: school.id,
                    school_logo: school.logo_url || null,
                    country: school.country,
                    account_banned: false,
                });
            });

            alert("تم إضافة المالك ✅");

            setOwnerName("");
            setOwnerPhone("");
            setOpenOwnerModal(false);

        } catch (error) {
            console.error(error);
            alert("خطأ أثناء إضافة المالك");
        } finally {
            setLoadingOwner(false);
        }
    };

    if (loading) {
        return (
        <div className="loader">
            <ClipLoader size={40} color="#3b82f6" />
        </div>
        );
    }

    if (!school) {
        return <div>المدرسة غير موجودة</div>;
    }

    return (
        <div className="school-details-container">
            {/* Header Card */}
            <div className="school-card">
                <div className="school-card-inner">
                    <div className="school-logo-box">
                        {school.logo_url ? (
                            <img src={school.logo_url} />
                        ) : (
                            <div className="logo-placeholder" />
                        )}
                    </div>
                    <div className="school-name-box">
                        <h2>{school.name}</h2>
                        <p>{school.country}</p>
                    </div>
                </div>
                <div className="back-btn" onClick={() => router.push("/")}>
                    <IoArrowBackCircle size={25}/>
                </div>
            </div>

            {/* Owners Section */}
            <div className="section">
                <div className="section-header">
                    <h3>المشرفون</h3>
                    <div 
                        className="create-btn"
                        style={{height:'25px'}} 
                        onClick={() => setOpenOwnerModal(true)}
                    >
                        <p>+ إضافة مشرف</p>
                    </div>
                </div>

                <div className="school-details-table">
                    <div className="school-details-table-header">
                        <span>الاسم</span>
                        <span>الهاتف</span>
                    </div>

                    {groupedEmployees["المشرف العام"]?.length === 0 ? (
                        <div className="empty">لا يوجد</div>
                    ) : (
                        groupedEmployees["المشرف العام"]?.map((emp) => (
                            <div key={emp.id} className="school-details-table-row">
                                <span>{emp.name}</span>
                                <span className="phone-number">{emp.phone_number}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                title="إضافة مشرف جديد"
                open={openOwnerModal}
                onCancel={() => setOpenOwnerModal(false)}
                footer={null}
                centered
            >
                <div className="create-school-form">
                    <input
                        placeholder="الاسم"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                    />
                    <input
                        placeholder="رقم الهاتف"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                    />
                    {loadingOwner ? (
                        <div className="btn-loading">
                            <ClipLoader size={15} color="#fff" />
                        </div>
                    ) : (
                        <button className="create-submit" onClick={handleAddOwner}>
                             إضافة
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default SchoolDetails;