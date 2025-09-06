import React, { useState } from 'react'
import { DB } from '../firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import ClipLoader from "react-spinners/ClipLoader"

const AddBalance = () => {
    const [userType, setUserType] = useState('')
    const [searchId, setSearchId] = useState('')
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [amountToAdd, setAmountToAdd] = useState('')
    const [addingAmountLoading, setAddingAmountLoading] = useState(false)

    const handleSearch = async () => {
        setError('')
        setLoading(true)
        setUserData(null)

        try {
            if (!userType) {
                setError('يرجى اختيار نوع المستخدم')
                return
            }

            const collectionName = userType === 'rider' ? 'users' : 'drivers'
            const userRef = doc(DB, collectionName, searchId.trim())
            const snapshot = await getDoc(userRef)

            if (snapshot.exists()) {
                setUserData({ id: snapshot.id, ...snapshot.data() })
            } else {
                setError('المستخدم غير موجود')
            }
        } catch (err) {
            console.error(err)
            setError('حدث خطأ أثناء البحث')
        } finally {
            setLoading(false)
        }
    }

    // Utility to format numbers with commas
    const formatNumberWithCommas = (value) => {
        if (!value && value !== 0) return "";
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Utility to remove commas
    const parseNumber = (value) => {
        return value.replace(/,/g, "");
    }

    // Handlers
    const handleAmountToAddChange = (e) => {
        const rawValue = parseNumber(e.target.value);
        if (!isNaN(rawValue)) {
            setAmountToAdd(rawValue);
        }
    }

    const handleAddBalance = async () => {
        if (!amountToAdd || isNaN(amountToAdd)) {
            alert('يرجى إدخال مبلغ صالح')
            return
        }

        const newAmount = parseFloat(amountToAdd)

        // use different field depending on type
        const balanceField = userType === 'rider' ? 'account_balance' : 'balance'
        const currentBalance = parseFloat(userData[balanceField] || 0)
        const updatedBalance = Number(currentBalance + newAmount)

        try {
            setAddingAmountLoading(true)
            const collectionName = userType === 'rider' ? 'users' : 'drivers'
            const userRef = doc(DB, collectionName, userData.id)
            await updateDoc(userRef, {
                [balanceField]: updatedBalance,
            })

            alert('تم تحديث الرصيد بنجاح')
            setUserData({ ...userData, [balanceField]: updatedBalance })
            setAmountToAdd('')
        } catch (err) {
            console.error(err)
            alert('حدث خطأ أثناء تحديث الرصيد')
        } finally {
            setAddingAmountLoading(false)
            setAmountToAdd('')
        }
    }

    // format balance amount
    const formatBalanceAmount = (amount) => {
        return amount?.toLocaleString('ar-IQ', {
            style: 'currency',
            currency: 'IQD',
            minimumFractionDigits: 0,
        })
    }

    return (
        <div className="white_card-section-container">
            <div className="user_balance_header">
                <div className="filter-item">
                    <select
                        onChange={(e) => setUserType(e.target.value)}
                        value={userType}
                    >
                        <option value="">نوع المستخدم</option>
                        <option value="rider">راكب</option>
                        <option value="driver">سائق</option>
                    </select>
                    <input
                        type="text"
                        placeholder="رمز المستخدم"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <button onClick={handleSearch}>ابحث</button>
                </div>
            </div>
            <div className="user_balance_main">
                {loading && <p>جاري البحث...</p>}
                {error && <p style={{ color: 'red',fontWeight:'bold' }}>{error}</p>}

                {userData && (
                    <div className="user_balance_main_user_info">
                        <div>
                            <h5 style={{ fontWeight: 'normal' }}>الاسم</h5>
                            <h5>
                                {userType === 'rider'
                                ? `${userData.user_full_name} ${userData.user_family_name}`
                                : `${userData.full_name} ${userData.family_name}`}
                            </h5>
                        </div>
                        <div>
                            <h5 style={{ fontWeight: 'normal' }}>رقم الهاتف</h5>
                            <h5>{userData.phone_number || '—'}</h5>
                        </div>
                        <div>
                            <h5 style={{ fontWeight: 'normal' }}>الرصيد الحالي</h5>
                            <h5>{formatBalanceAmount(userType === 'rider'? userData.account_balance ?? 0: userData.balance ?? 0)}</h5>
                        </div>
                        <div className="filter-item" style={{ marginTop: '20px'}}>
                            <input
                                type="text"
                                placeholder="المبلغ"
                                value={formatNumberWithCommas(amountToAdd)}
                                onChange={handleAmountToAddChange}
                                style={{width:'200px'}}
                            />
                            {addingAmountLoading ? (
                                <div
                                    style={{
                                        width: '100px',
                                        height: '30px',
                                        backgroundColor: '#955BFE',
                                        borderRadius: '7px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ClipLoader
                                        color={'#fff'}
                                        loading={addingAmountLoading}
                                        size={10}
                                        aria-label="Loading Spinner"
                                        data-testid="loader"
                                    />
                                </div>
                            ) : (
                                <button style={{ width: '120px' }} onClick={handleAddBalance}>
                                    إضافة الرصيد
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AddBalance
