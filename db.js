/* ================================================================
   db.js — Couche données : Firebase (si configuré) + localStorage
   ================================================================ */

const DB = {
  _local: {},

  _ls(key, val) {
    if (val !== undefined) { localStorage.setItem("ef_" + key, JSON.stringify(val)); return val; }
    try { return JSON.parse(localStorage.getItem("ef_" + key) || "null"); } catch { return null; }
  },

  // ── USERS ──────────────────────────────────────────────────────
  async createUser(uid, data) {
    if (window.__firebaseReady === true) {
      const { doc, setDoc } = window.__fbFns;
      await setDoc(doc(window.__db, "users", uid), { ...data, createdAt: new Date().toISOString() });
    } else {
      const users = this._ls("users") || {};
      users[uid] = { ...data, createdAt: new Date().toISOString() };
      this._ls("users", users);
    }
  },

  async getUser(uid) {
    if (window.__firebaseReady === true) {
      const { doc, getDoc } = window.__fbFns;
      const snap = await getDoc(doc(window.__db, "users", uid));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } else {
      const users = this._ls("users") || {};
      return users[uid] ? { id: uid, ...users[uid] } : null;
    }
  },

  // ── CLASSES ────────────────────────────────────────────────────
  async createClass(data) {
    const code = Math.random().toString(36).substring(2, 5).toUpperCase() + "-" +
                 Math.random().toString(36).substring(2, 5).toUpperCase();
    const classData = { ...data, code, students: [], createdAt: new Date().toISOString() };
    if (window.__firebaseReady === true) {
      const { collection, addDoc } = window.__fbFns;
      const ref = await addDoc(collection(window.__db, "classes"), classData);
      return { id: ref.id, ...classData };
    } else {
      const id = "cls_" + Date.now();
      const classes = this._ls("classes") || {};
      classes[id] = classData;
      this._ls("classes", classes);
      return { id, ...classData };
    }
  },

  async getTeacherClasses(teacherId) {
    if (window.__firebaseReady === true) {
      const { collection, query, where, getDocs } = window.__fbFns;
      const q = query(collection(window.__db, "classes"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const classes = this._ls("classes") || {};
      return Object.entries(classes)
        .filter(([, v]) => v.teacherId === teacherId)
        .map(([id, v]) => ({ id, ...v }));
    }
  },

  async getClassByCode(code) {
    if (window.__firebaseReady === true) {
      const { collection, query, where, getDocs } = window.__fbFns;
      const q = query(collection(window.__db, "classes"), where("code", "==", code.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } else {
      const classes = this._ls("classes") || {};
      const entry = Object.entries(classes).find(([, v]) => v.code === code.toUpperCase());
      return entry ? { id: entry[0], ...entry[1] } : null;
    }
  },

  async addStudentToClass(classId, studentId) {
    if (window.__firebaseReady === true) {
      const { doc, getDoc, updateDoc } = window.__fbFns;
      const ref = doc(window.__db, "classes", classId);
      const snap = await getDoc(ref);
      const students = snap.data().students || [];
      if (!students.includes(studentId)) {
        await updateDoc(ref, { students: [...students, studentId] });
      }
    } else {
      const classes = this._ls("classes") || {};
      if (classes[classId]) {
        if (!classes[classId].students) classes[classId].students = [];
        if (!classes[classId].students.includes(studentId)) {
          classes[classId].students.push(studentId);
          this._ls("classes", classes);
        }
      }
    }
  },

  async getClass(classId) {
    if (window.__firebaseReady === true) {
      const { doc, getDoc } = window.__fbFns;
      const snap = await getDoc(doc(window.__db, "classes", classId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } else {
      const classes = this._ls("classes") || {};
      return classes[classId] ? { id: classId, ...classes[classId] } : null;
    }
  },

  // ── DOCUMENTS ──────────────────────────────────────────────────
  async saveDoc(data) {
    const docData = { ...data, createdAt: new Date().toISOString() };
    if (window.__firebaseReady === true) {
      const { collection, addDoc } = window.__fbFns;
      const ref = await addDoc(collection(window.__db, "documents"), docData);
      return { id: ref.id, ...docData };
    } else {
      const id = "doc_" + Date.now();
      const docs = this._ls("documents") || {};
      docs[id] = docData;
      this._ls("documents", docs);
      return { id, ...docData };
    }
  },

  async getTeacherDocs(teacherId) {
    if (window.__firebaseReady === true) {
      const { collection, query, where, getDocs } = window.__fbFns;
      const q = query(collection(window.__db, "documents"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const docs = this._ls("documents") || {};
      return Object.entries(docs)
        .filter(([, v]) => v.teacherId === teacherId)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  async getDoc(docId) {
    if (window.__firebaseReady === true) {
      const { doc, getDoc } = window.__fbFns;
      const snap = await getDoc(doc(window.__db, "documents", docId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } else {
      const docs = this._ls("documents") || {};
      return docs[docId] ? { id: docId, ...docs[docId] } : null;
    }
  },

  async deleteDoc(docId) {
    if (window.__firebaseReady === true) {
      const { doc, deleteDoc } = window.__fbFns;
      await deleteDoc(doc(window.__db, "documents", docId));
    } else {
      const docs = this._ls("documents") || {};
      delete docs[docId];
      this._ls("documents", docs);
    }
  },

  // ── SHARES (doc partagé à une classe) ─────────────────────────
  async shareDocToClass(docId, classId, options = {}) {
    const shareData = { docId, classId, ...options, sharedAt: new Date().toISOString() };
    if (window.__firebaseReady === true) {
      const { collection, addDoc } = window.__fbFns;
      const ref = await addDoc(collection(window.__db, "shares"), shareData);
      return { id: ref.id, ...shareData };
    } else {
      const id = "shr_" + Date.now();
      const shares = this._ls("shares") || {};
      shares[id] = shareData;
      this._ls("shares", shares);
      return { id, ...shareData };
    }
  },

  async getClassShares(classId) {
    if (window.__firebaseReady === true) {
      const { collection, query, where, getDocs } = window.__fbFns;
      const q = query(collection(window.__db, "shares"), where("classId", "==", classId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const shares = this._ls("shares") || {};
      return Object.entries(shares)
        .filter(([, v]) => v.classId === classId)
        .map(([id, v]) => ({ id, ...v }));
    }
  },

  async getStudentShares(classId) {
    return this.getClassShares(classId);
  },

  // ── SUBMISSIONS ────────────────────────────────────────────────
  async submitWork(data) {
    const sub = { ...data, submittedAt: new Date().toISOString(), status: "pending" };
    if (window.__firebaseReady === true) {
      const { collection, addDoc } = window.__fbFns;
      const ref = await addDoc(collection(window.__db, "submissions"), sub);
      return { id: ref.id, ...sub };
    } else {
      const id = "sub_" + Date.now();
      const subs = this._ls("submissions") || {};
      subs[id] = sub;
      this._ls("submissions", subs);
      return { id, ...sub };
    }
  },

  async getSubmissions(filters = {}) {
    let subs = [];
    if (window.__firebaseReady === true) {
      const { collection, query, where, getDocs } = window.__fbFns;
      let q = collection(window.__db, "submissions");
      if (filters.teacherId) q = query(q, where("teacherId", "==", filters.teacherId));
      if (filters.studentId) q = query(q, where("studentId", "==", filters.studentId));
      if (filters.classId)   q = query(q, where("classId", "==", filters.classId));
      const snap = await getDocs(q);
      subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const all = this._ls("submissions") || {};
      subs = Object.entries(all).map(([id, v]) => ({ id, ...v }));
      if (filters.teacherId) subs = subs.filter(s => s.teacherId === filters.teacherId);
      if (filters.studentId) subs = subs.filter(s => s.studentId === filters.studentId);
      if (filters.classId)   subs = subs.filter(s => s.classId === filters.classId);
    }
    return subs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },

  async gradeSubmission(subId, score, comment) {
    if (window.__firebaseReady === true) {
      const { doc, updateDoc } = window.__fbFns;
      await updateDoc(doc(window.__db, "submissions", subId), {
        score, comment, status: "graded", gradedAt: new Date().toISOString()
      });
    } else {
      const subs = this._ls("submissions") || {};
      if (subs[subId]) {
        subs[subId] = { ...subs[subId], score, comment, status: "graded", gradedAt: new Date().toISOString() };
        this._ls("submissions", subs);
      }
    }
  },
};
