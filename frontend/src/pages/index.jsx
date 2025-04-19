import React from "react";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";



export default function Home() {

  const router = useRouter();

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer_left}>
              <p>Connect with Friends without Exaggeration</p>
              <p>A True social media platform, with stories no bluffs !</p>
              <div onClick={() => {
                router.push("/login")
              }} className={styles.buttonJoin}>
                <p>Join Now</p>
              </div>
          </div>
          <div className={styles.mainContainer_right}>
              <img src="/images/img.jpg" alt="image" />
          </div>  
        </div>  
      </div> 
    </UserLayout>
  );
}
