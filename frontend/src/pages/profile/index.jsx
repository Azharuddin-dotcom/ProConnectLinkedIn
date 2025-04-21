import { getAboutUser } from '@/config/redux/action/authAction/index.js'
import DashboardLayout from '@/layout/DashboardLayout'
import UserLayout from '@/layout/UserLayout'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.css';
import { BASE_URL } from '@/config/index.jsx';
import { getAllPosts } from '@/config/redux/action/postAction/index.js';
import { clientServer } from '@/config';

export default function ProfilePage() {
    const authState = useSelector(state => state.auth);
    const postReducer = useSelector((state) => state.postReducer);
    const [userProfile, setUserProfile] = useState({});
    const [userPosts, setUserPosts] = useState([]);
    
    // Separate states for work and education modals
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [isEduModalOpen, setIsEduModalOpen] = useState(false);
    
    const [inputData, setInputData] = useState({ company: '', position: '', years: '' });
    const [eduData, setEduData] = useState({ school: '', degree: '', fieldOfStudy: '' });

    const handleWorkInputChange = (e) => {
      const { name, value } = e.target;
      setInputData({ ...inputData, [name]: value });
    }

    const handleEduInputChange = (e) => {
      const { name, value } = e.target;
      setEduData({...eduData, [name]: value });
    }

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAboutUser({ token: localStorage.getItem("token")  }))
        dispatch(getAllPosts());
    }, [])

    useEffect(() => {
        if(authState.user != undefined) {
            setUserProfile(authState.user);

            let post = postReducer.posts.filter((post) => {
                return post.userId.username === authState.user.userId.username;
            })
            console.log(post, authState.user.userId.username);
            setUserPosts(post);
        }
    }, [authState.user, postReducer.posts])

    const updateProfilePicture = async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file);
        formData.append('token', localStorage.getItem("token"));

        const response = await clientServer.post("/update_profile_picture", formData, {
            headers: {
                'Content-Type':'multipart/form-data'
            }
        });

        dispatch(getAboutUser({ token: localStorage.getItem("token")  }));
    }

    const updateProfileData = async () => {
      const request = await clientServer.post("/user_update", {
        token: localStorage.getItem("token"),
        name: userProfile.userId.name,
      });

      const response = await clientServer.post("/update_profile_data", {
        token: localStorage.getItem("token"),
        bio: userProfile.bio,
        currentPost: userProfile.currentPost,
        pastWork: userProfile.pastWork,
        education: userProfile.education,
      });

      dispatch(getAboutUser({ token: localStorage.getItem("token")  }));
    }

    const addWork = () => {
      setUserProfile({ ...userProfile, pastWork: [...userProfile.pastWork, inputData] });
      setIsWorkModalOpen(false);
      setInputData({ company: '', position: '', years: '' }); // Reset form
    }

    const addEducation = () => {
      setUserProfile({ ...userProfile, education: [...userProfile.education, eduData] });
      setIsEduModalOpen(false);
      setEduData({ school: '', degree: '', fieldOfStudy: '' }); // Reset form
    }

    return (
        <UserLayout>
            <DashboardLayout>
                {authState.user && userProfile.userId && 
                <div className={styles.container}>
                    <div className={styles.backDropContainer}>
                        <label htmlFor='profilePictureUpload' className={styles.backDrop__overlay}>
                            <p>Edit</p>
                        </label>
                        <input 
                            onChange={(e) => updateProfilePicture(e.target.files[0])} 
                            hidden type="file" 
                            id='profilePictureUpload' 
                        />
                        <img 
                            className={styles.backDrop} 
                            src={`${BASE_URL}/${userProfile.userId.profilePicture}`} 
                            alt="backdrop" 
                        />
                    </div>
    
                    <div className={styles.profileContainer__details}>
                        <div style={{ display: "flex", gap: "0.7rem" }}>
                            <div style={{flex: "0.8"}}>
                                <div style={{ display: "flex", width: "fit-content", alignItems: "center", gap: "1.2rem" }}>
                                    <input 
                                        className={styles.nameEdit} 
                                        type="text" 
                                        value={userProfile.userId.name} 
                                        onChange={(e) => {
                                            setUserProfile({ 
                                                ...userProfile, 
                                                userId: { ...userProfile.userId, name: e.target.value }
                                            })
                                        }} 
                                    />
                                    <p style={{ color: "grey" }}>@{userProfile.userId.username}</p>
                                </div>
                                
                                <div>
                                    <textarea 
                                        value={userProfile.bio}
                                        onChange={(e) => {
                                            setUserProfile({ ...userProfile, bio: e.target.value });
                                        }} 
                                        rows={Math.max(3, Math.ceil(userProfile.bio.length / 80))}
                                        style={{ width: "100%", background: "lightgrey", borderRadius: "0.5rem", padding: "1rem" }}  
                                    />
                                </div>
                            </div>
    
                            <div style={{flex: "0.2"}}>
                                <h3>Recent Activity</h3>
                                {userPosts.map((post) => {
                                    return (
                                        <div key={post._id} className={styles.postCard}>
                                            <div className={styles.card}>
                                                <div className={styles.card__profileContainer}>
                                                    {post.media !== "" ? 
                                                        <img src={`${BASE_URL}/${post.media}`} alt="post" /> : 
                                                        <div style={{ width: "3.4rem", height: "3.4rem" }}></div>
                                                    }
                                                </div>  
                                                <p>{post.body}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
    
                    {/* Work History Section */}
                    <div className={styles.workHistory}>
                        <h4>Work History</h4>
                        <div className={styles.workHistoryContainer}>
                            {userProfile.pastWork.map((work, index) => {
                                return (
                                    <div key={index} className={styles.workHistoryCard}>
                                        <p style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                            {work.company} - {work.position}
                                        </p>
                                        <p>{work.years}</p>
                                    </div>
                                )
                            })}
                            <button 
                                className={styles.addWorkButton} 
                                onClick={() => setIsWorkModalOpen(true)}
                            >
                                Add Work
                            </button>
                        </div>
                    </div>
                    
                    {/* Education Section */}
                    <div className={styles.workHistory}>
                        <h4>Education</h4>
                        <div className={styles.workHistoryContainer}>
                            {userProfile.education.map((education, index) => {
                                return (
                                    <div key={index} className={styles.workHistoryCard}>
                                        <p style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                            {education.school} - {education.degree}
                                        </p>
                                        <p>{education.fieldOfStudy}</p>
                                    </div>
                                )
                            })}
                            <button 
                                className={styles.addWorkButton} 
                                onClick={() => setIsEduModalOpen(true)}
                            >
                                Add Education
                            </button>
                        </div>
                    </div>
                            
                    {userProfile != authState.user && 
                        <div 
                            onClick={updateProfileData} 
                            className={styles.updateProfileBtn}
                        >
                            Update Profile
                        </div>
                    }        
                </div>
                }

                {/* Work Modal */}
                {isWorkModalOpen && 
                    <div 
                        onClick={() => setIsWorkModalOpen(false)} 
                        className={styles.commentsContainer}
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className={styles.allCommentsContainer}
                        >
                            <h3>Add Work Experience</h3>
                            <input
                                onChange={handleWorkInputChange}
                                name='company'
                                value={inputData.company}
                                className={styles.inputField}
                                type="text"
                                placeholder="Enter Company"
                            />
                            <input
                                onChange={handleWorkInputChange}
                                name='position'
                                value={inputData.position}
                                className={styles.inputField}
                                type="text"
                                placeholder="Enter Position"
                            />
                            <input
                                onChange={handleWorkInputChange}
                                name='years'
                                value={inputData.years}
                                className={styles.inputField}
                                type="number"
                                placeholder="Years"
                            />
                            <div 
                                onClick={addWork} 
                                className={styles.updateProfileBtn}
                            >
                                Add Work
                            </div>
                        </div>
                    </div>
                }

                {/* Education Modal */}
                {isEduModalOpen && 
                    <div 
                        onClick={() => setIsEduModalOpen(false)} 
                        className={styles.commentsContainer}
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className={styles.allCommentsContainer}
                        >
                            <h3>Add Education</h3>
                            <input
                                onChange={handleEduInputChange}
                                name='school'
                                value={eduData.school}
                                className={styles.inputField}
                                type="text"
                                placeholder="Enter school"
                            />
                            <input
                                onChange={handleEduInputChange}
                                name='degree'
                                value={eduData.degree}
                                className={styles.inputField}
                                type="text"
                                placeholder="Enter degree"
                            />
                            <input
                                onChange={handleEduInputChange}
                                name='fieldOfStudy'
                                value={eduData.fieldOfStudy}
                                className={styles.inputField}
                                type="text"
                                placeholder="Field of study"
                            />
                            <div 
                                onClick={addEducation} 
                                className={styles.updateProfileBtn}
                            >
                                Add Education
                            </div>
                        </div>
                    </div>
                }
            </DashboardLayout>
        </UserLayout>
    )
}