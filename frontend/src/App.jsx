import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';



const App = () => {
  return (
    <div className='relative overflow-hidden'>
      <div className='fixed z-[99] w-full'>
          <Navbar />
        </div>

      <div className='md:mx-[10%]'>
        <ToastContainer />
        <Routes>
          <Route path='/' element={<Dashboard/>} />
        </Routes>
      </div>

      <Footer/>
    </div>
  )
}

export default App