import React, { useEffect } from 'react'
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { getMyConnectionRequests, AcceptConnection  } from "@/config/redux/action/authAction/index.js";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { BASE_URL } from '@/config/index.jsx';
export default function MyConnectionsPage() {

  const dispatch = useDispatch();

  const authState = useSelector(state => state.auth);

  const router = useRouter();

  useEffect(() => {
    dispatch(getMyConnectionRequests({ token: localStorage.getItem('token') }));
  }, []);

  useEffect(() => {

    if (authState.connectionRequest.length != 0) {
      console.log(authState.connectionRequest);
    }

  }, [authState.connectionRequest]);

  return (
    <UserLayout>

        <DashboardLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.7rem" }}>
                <h4>My Connections</h4>
                {authState.connectionRequest.length === 0 && <h1>No Connection Request Pending</h1>}

                {authState.connectionRequest.length != 0 && authState.connectionRequest.filter((connection) => connection.status_accepted === null).map((user, index) => {
                  return (
                    <div onClick={() => {
                      router.push(`/view_profile/${user.userId.username}`)
                    }} className={styles.userCard} key={index}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", justifyContent: "space-between" }}>
                        <div className={styles.profilePicture}>
                          <img src={`${BASE_URL}/${user.userId.profilePicture}`} alt='picture' />
                        </div>
                        <div className={styles.userInfo}>
                          <h3>{user.userId.name}</h3>
                          <p>{user.userId.username}</p>  
                        </div>
                        <button onClick={(e) => {
                          e.stopPropagation();

                          dispatch(AcceptConnection({
                            connectionId: user._id,
                            token: localStorage.getItem('token'),
                            action: "accept"
                          }))
                        }} className={styles.connectedButton}>Accept</button>
                      </div>      
                    </div>
                  )
                })}

                <h4>My Network</h4>
                { authState.connectionRequest.filter((connection) => connection.status_accepted !== null).map((user, index) => {
                  return (
                    <div onClick={() => {
                      router.push(`/view_profile/${user.userId.username}`)
                    }} className={styles.userCard} key={index}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", justifyContent: "space-between" }}>
                        <div className={styles.profilePicture}>
                          <img src={`${BASE_URL}/${user.userId.profilePicture}`} alt='picture' />
                        </div>
                        <div className={styles.userInfo}>
                          <h3>{user.userId.name}</h3>
                          <p>{user.userId.username}</p>  
                        </div>
                      </div>      
                    </div>
                  )
                })}
            </div>
        </DashboardLayout>

    </UserLayout>
  )
}
