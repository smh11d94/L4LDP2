"use client"
import Link from 'next/link';
import { useState } from 'react';
import './Navigation.css'

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </div>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <Link href="/">Home</Link>
        <Link href="/create">Create</Link>
        <Link href="/cm">Course Management</Link>
        <Link href="/pm">Problem Management</Link>
      </nav>
    </>
  );
}

export default Navigation;