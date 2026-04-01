import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ text: "", tags: [], pinned: false, folder: "General" });
  const [folders, setFolders] = useState(["General", "Personal", "Work", "Ideas"]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [quickNote, setQuickNote] = useState("");

  const notesCollection = collection(db, "notes");

  // Available tags
  const availableTags = ["All", "Important", "Idea", "Task", "Meeting", "Personal", "Work"];

  // Fetch notes
  const fetchNotes = async () => {
    const data = await getDocs(notesCollection);
    const notesData = data.docs.map((doc) => ({ 
      ...doc.data(), 
      id: doc.id,
      tags: doc.data().tags || [],
      pinned: doc.data().pinned || false,
      folder: doc.data().folder || "General",
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    setNotes(notesData);
    filterNotes(notesData, searchTerm, selectedTag, selectedFolder);
  };

  // Filter notes based on search, tag, and folder
  const filterNotes = (notesData, search, tag, folder) => {
    let filtered = notesData;
    
    if (search) {
      filtered = filtered.filter(note => 
        note.text.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (tag && tag !== "All") {
      filtered = filtered.filter(note => note.tags.includes(tag));
    }
    
    if (folder && folder !== "All") {
      filtered = filtered.filter(note => note.folder === folder);
    }
    
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
    
    setFilteredNotes(filtered);
  };

  const addNote = async () => {
    if (currentNote.text.trim() === "") return;
    
    await addDoc(notesCollection, { 
      text: currentNote.text,
      tags: currentNote.tags,
      pinned: currentNote.pinned,
      folder: currentNote.folder,
      createdAt: new Date()
    });
    
    setShowModal(false);
    setCurrentNote({ text: "", tags: [], pinned: false, folder: "General" });
    fetchNotes();
  };

  const addQuickNote = async () => {
    if (quickNote.trim() === "") return;
    
    await addDoc(notesCollection, { 
      text: quickNote,
      tags: [],
      pinned: false,
      folder: selectedFolder === "All" ? "General" : selectedFolder,
      createdAt: new Date()
    });
    
    setQuickNote("");
    fetchNotes();
  };

  const deleteNote = async (id) => {
    const noteDoc = doc(db, "notes", id);
    await deleteDoc(noteDoc);
    fetchNotes();
  };

  const togglePin = async (id, currentPinned) => {
    const noteDoc = doc(db, "notes", id);
    await updateDoc(noteDoc, { pinned: !currentPinned });
    fetchNotes();
  };

  const addFolder = async () => {
    if (newFolderName.trim() && !folders.includes(newFolderName)) {
      setFolders([...folders, newFolderName]);
      setNewFolderName("");
      setShowFolderModal(false);
    }
  };

  const toggleTag = (tag) => {
    if (currentNote.tags.includes(tag)) {
      setCurrentNote({
        ...currentNote,
        tags: currentNote.tags.filter(t => t !== tag)
      });
    } else {
      setCurrentNote({
        ...currentNote,
        tags: [...currentNote.tags, tag]
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchNotes();
  }, []);

  // Update filters when dependencies change
  useEffect(() => {
    filterNotes(notes, searchTerm, selectedTag, selectedFolder);
  }, [searchTerm, selectedTag, selectedFolder, notes]);

  return (
    <div className="app">
      <div className="background">
        <div className="gradient-bg"></div>
      </div>

      <div className="container">
        <header className="header glass">
          <h1 className="title">
            <span className="title-icon">📝</span>
            Notes
          </h1>
          
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button className="create-btn glass" onClick={() => setShowModal(true)}>
            <span className="btn-icon">+</span>
            New Note
          </button>
        </header>

        <div className="quick-note-section glass">
          <h3 className="section-title">Quick Note</h3>
          <div className="quick-note-input">
            <input
              type="text"
              placeholder="Jot down a quick thought..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addQuickNote()}
            />
            <button onClick={addQuickNote} className="quick-btn">Save</button>
          </div>
        </div>

        <div className="nav-section glass">
          <div className="folders">
            <div className="nav-header">
              <span className="nav-icon">📁</span>
              <span>Folders</span>
              <button className="add-folder-btn" onClick={() => setShowFolderModal(true)}>+</button>
            </div>
            <div className="nav-items">
              <button 
                className={`nav-item ${selectedFolder === "All" ? "active" : ""}`}
                onClick={() => setSelectedFolder("All")}
              >
                All Notes
              </button>
              {folders.map(folder => (
                <button
                  key={folder}
                  className={`nav-item ${selectedFolder === folder ? "active" : ""}`}
                  onClick={() => setSelectedFolder(folder)}
                >
                  {folder}
                </button>
              ))}
            </div>
          </div>

          <div className="tags">
            <div className="nav-header">
              <span className="nav-icon">🏷️</span>
              <span>Tags</span>
            </div>
            <div className="nav-items tags-list">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`tag ${selectedTag === tag ? "active" : ""}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="notes-grid">
          {filteredNotes.length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-icon">📭</div>
              <p>No notes yet. Create your first note!</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div key={note.id} className={`note-card glass ${note.pinned ? "pinned" : ""}`}>
                <div className="card-header">
                  <button className="pin-btn" onClick={() => togglePin(note.id, note.pinned)}>
                    {note.pinned ? "📌" : "📍"}
                  </button>
                  <button className="delete-btn" onClick={() => deleteNote(note.id)}>🗑️</button>
                </div>
                <p className="note-text">{note.text}</p>
                <div className="card-footer">
                  <div className="tags-container">
                    {note.tags.map(tag => (
                      <span key={tag} className="note-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="folder-indicator">📁 {note.folder}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Note</h2>
            <textarea
              placeholder="Write your note here..."
              value={currentNote.text}
              onChange={(e) => setCurrentNote({ ...currentNote, text: e.target.value })}
              className="note-textarea"
            />
            <div className="modal-section">
              <label>Folder</label>
              <select
                value={currentNote.folder}
                onChange={(e) => setCurrentNote({ ...currentNote, folder: e.target.value })}
                className="folder-select"
              >
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>
            <div className="modal-section">
              <label>Tags</label>
              <div className="tag-selector">
                {availableTags.slice(1).map(tag => (
                  <button
                    key={tag}
                    className={`tag-option ${currentNote.tags.includes(tag) ? "selected" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="save-btn" onClick={addNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="folder-input"
              onKeyPress={(e) => e.key === 'Enter' && addFolder()}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowFolderModal(false)}>Cancel</button>
              <button className="save-btn" onClick={addFolder}>Create Folder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;