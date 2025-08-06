import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { Link } from "react-router-dom";

const InboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await API.get("/messages/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(res.data);
      } catch (err) {
        console.error("Inbox fetch error", err);
      }
    };

    fetchInbox();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-4">Inbox</h2>
      <ul className="space-y-3">
        {conversations.map((conv, idx) => (
          <li key={idx} className="p-3 border rounded shadow bg-white">
            <Link to={`/chat/${conv.user._id}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">{conv.user.username}</span>
                <small className="text-gray-500">
                  {new Date(conv.lastTime).toLocaleString()}
                </small>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {conv.lastMessage}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InboxPage;
