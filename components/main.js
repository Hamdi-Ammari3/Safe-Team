"use client";

import React,{useState} from "react";
import { useGlobalState } from "../globalState";
import { useRouter } from "next/navigation";
import ClipLoader from "react-spinners/ClipLoader";
import { MdSchool, MdPeople, MdDirectionsBus, MdRoute } from "react-icons/md";
import '../app/style.css'

const Main = () => {
  const { students, schools, drivers, lines, loading } = useGlobalState();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  //Logout
  const handleLogout = () => {
    setLoggingOut(true);

    // let UI update first
    setTimeout(() => {
      localStorage.removeItem("adminLoggedIn"); 
      localStorage.removeItem("adminDahboardName"); 
      sessionStorage.clear();

      router.push("/login");
    }, 300);
  };

  const stats = [
    {
      title: "إجمالي المدارس",
      value: schools.length,
      icon: MdSchool,
    },
    {
      title: "إجمالي الطلاب",
      value: students.length,
      icon: MdPeople,
    },
    {
      title: "إجمالي السائقين",
      value: drivers.length,
      icon: MdDirectionsBus,
    },
    {
      title: "إجمالي الخطوط",
      value: lines.length,
      icon: MdRoute,
    },
  ];

  return (
    <div className="main-container">
      <h2 className="main-title">نظرة عامة</h2>

      <div className="logout-btn" onClick={handleLogout}>
       تسجيل الخروج
      </div>

      {loggingOut && (
        <div className="page-loading-overlay">
          <ClipLoader size={40} color="#000" />
          <p>جاري تسجيل الخروج...</p>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <Icon size={22} />
              </div>

              <div className="stat-info">
                <p>{stat.title}</p>

                {loading ? (
                  <ClipLoader size={10} color="#3b82f6" />
                ) : (
                  <h3>{stat.value}</h3>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Main;