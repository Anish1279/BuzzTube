"use client"

import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'


function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const { user } = useUser();
    useEffect(() => {
        user && createNewUser();
    }, [user]);

    const createNewUser = async () => {
    // Safety check: Don't run if user is not loaded yet
    if (!user) return; 

    try {
        const result = await axios.post('/api/user', {
            user: user
        });
        console.log("User created:", result.data);
    } catch (error) {
        console.error("Error creating user:", error);
    }
}

    return (
        <div>
            {children}
        </div>
    )
}



export default Provider

