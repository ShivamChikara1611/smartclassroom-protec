import React, { useState, useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { LanguageContext } from '../context/LanguageContext';
import assets from '../assets/assets';

const Navbar = () => {

    const { language, toggleLanguage } = useContext(LanguageContext);

    const texts = {
        en: { switch: "日本語", heading: "Smart Classroom Automation System" },
        jp: { switch: "English", heading: "スマートクラスルームオートメーションシステム" },
    };


    return (
        <div className={`flex items-center justify-between text-sm py-2 shadow-md backdrop-blur-lg text-primary px-2 md:px-[10%]`}>
            <img src={assets.logo} className='cursor-pointer' alt="" />

            <h1 className='text-xl font-thin tracking-wider'>{texts[language].heading}</h1>

            <button
                onClick={toggleLanguage}
                className="bg-secondary/40 px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer"
            >
                {texts[language].switch}
            </button>
        </div>
    )
}

export default Navbar