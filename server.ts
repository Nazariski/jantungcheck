import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Function to seed initial data if DB is empty
  async function seedDatabase() {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        await prisma.user.createMany({
          data: [
            { username: "admin", password: bcrypt.hashSync("admin123", 10), role: "Admin", name: "Administrator" },
            { username: "staff", password: bcrypt.hashSync("staff123", 10), role: "Staff", name: "Staff Klinik" },
          ]
        });
      }

      const patientCount = await prisma.patient.count();
      if (patientCount === 0) {
        await prisma.patient.createMany({
          data: [
            { id: "1", name: "Budi Santoso", department: "Produksi", age: 45, gender: "Laki-laki", address: "Tangerang", phone: "08123456789" },
            { id: "2", name: "Siti Aminah", department: "HRD", age: 52, gender: "Perempuan", address: "Jakarta", phone: "08987654321" },
          ]
        });
      }

      const symptomCount = await prisma.symptom.count();
      if (symptomCount === 0) {
        await prisma.symptom.createMany({
          data: [
            { id: "G01", name: "Nyeri Dada", type: "Gejala Utama", cfPakar: 0.8 },
            { id: "G02", name: "Sesak Napas", type: "Gejala Utama", cfPakar: 0.7 },
            { id: "G03", name: "Keringat Dingin", type: "Gejala Tambahan", cfPakar: 0.4 },
            { id: "G04", name: "Mual/Muntah", type: "Gejala Tambahan", cfPakar: 0.3 },
          ]
        });
      }

      const diseaseCount = await prisma.disease.count();
      if (diseaseCount === 0) {
        await prisma.disease.createMany({
          data: [
            { 
              id: "P01", 
              name: "Penyakit Jantung Koroner", 
              description: "Penyumbatan pada pembuluh darah koroner.",
              solusiRendah: "Menjaga pola makan sehat dan olahraga teratur.",
              solusiRingan: "Konsultasi dokter dan mulai pengobatan rutin.",
              solusiTinggi: "Tindakan medis segera (kateterisasi/bypass) dan perawatan intensif."
            },
            { 
              id: "P02", 
              name: "Gagal Jantung", 
              description: "Kondisi jantung tidak mampu memompa darah secara optimal.",
              solusiRendah: "Batasi asupan garam dan cairan.",
              solusiRingan: "Penggunaan obat diuretik dan pemantauan berat badan harian.",
              solusiTinggi: "Rawat inap dan bantuan alat pompa jantung jika diperlukan."
            },
            { 
              id: "P03", 
              name: "Aritmia", 
              description: "Gangguan irama jantung.",
              solusiRendah: "Hindari kafein dan stres berlebih.",
              solusiRingan: "Penggunaan obat pengatur irama jantung.",
              solusiTinggi: "Tindakan ablasi atau pemasangan alat pacu jantung (pacemaker)."
            },
          ]
        });
      }

      const ruleCount = await prisma.rule.count();
      if (ruleCount === 0) {
        await prisma.rule.createMany({
          data: [
            { disease: "Penyakit Jantung Koroner", diseaseSeverity: "berat", conditions: [{ symptomId: "G01", operator: "NONE", severity: "berat" }] },
            { disease: "Penyakit Jantung Koroner", diseaseSeverity: "sedang", conditions: [{ symptomId: "G01", operator: "NONE", severity: "sedang" }] },
            { disease: "Penyakit Jantung Koroner", diseaseSeverity: "ringan", conditions: [{ symptomId: "G01", operator: "NONE", severity: "ringan" }] },
            { disease: "Penyakit Jantung Koroner", diseaseSeverity: "sedang", conditions: [{ symptomId: "G02", operator: "NONE", severity: "sedang" }] },
            { disease: "Gagal Jantung", diseaseSeverity: "berat", conditions: [{ symptomId: "G02", operator: "NONE", severity: "berat" }] },
            { disease: "Gagal Jantung", diseaseSeverity: "ringan", conditions: [{ symptomId: "G03", operator: "NONE", severity: "ringan" }] },
            { disease: "Aritmia", diseaseSeverity: "sedang", conditions: [{ symptomId: "G04", operator: "NONE", severity: "sedang" }] },
          ]
        });
      }
    } catch (err) {
      console.error("Database error during seeding:", err);
    }
  }

  // In-memory data as fallback
  let users: any[] = [
    { id: 1, username: "admin", password: bcrypt.hashSync("admin123", 10), role: "Admin", name: "Administrator" },
    { id: 2, username: "staff", password: bcrypt.hashSync("staff123", 10), role: "Staff", name: "Staff Klinik" },
  ];

  let patients: any[] = [
    { id: "1", name: "Budi Santoso", department: "Produksi", age: 45, gender: "Laki-laki", address: "Tangerang", phone: "08123456789" },
    { id: "2", name: "Siti Aminah", department: "HRD", age: 52, gender: "Perempuan", address: "Jakarta", phone: "08987654321" },
  ];

  let symptoms: any[] = [
    { id: "G01", name: "Nyeri Dada", type: "Gejala Utama", cfPakar: 0.8 },
    { id: "G02", name: "Sesak Napas", type: "Gejala Utama", cfPakar: 0.7 },
    { id: "G03", name: "Keringat Dingin", type: "Gejala Tambahan", cfPakar: 0.4 },
    { id: "G04", name: "Mual/Muntah", type: "Gejala Tambahan", cfPakar: 0.3 },
  ];

  let diseases: any[] = [
    { 
      id: "P01", 
      name: "Penyakit Jantung Koroner", 
      description: "Penyumbatan pada pembuluh darah koroner.",
      solusiRendah: "Menjaga pola makan sehat dan olahraga teratur.",
      solusiRingan: "Konsultasi dokter dan mulai pengobatan rutin.",
      solusiTinggi: "Tindakan medis segera (kateterisasi/bypass) dan perawatan intensif."
    },
    { 
      id: "P02", 
      name: "Gagal Jantung", 
      description: "Kondisi jantung tidak mampu memompa darah secara optimal.",
      solusiRendah: "Batasi asupan garam dan cairan.",
      solusiRingan: "Penggunaan obat diuretik dan pemantauan berat badan harian.",
      solusiTinggi: "Rawat inap dan bantuan alat pompa jantung jika diperlukan."
    },
    { 
      id: "P03", 
      name: "Aritmia", 
      description: "Gangguan irama jantung.",
      solusiRendah: "Hindari kafein dan stres berlebih.",
      solusiRingan: "Pemberian obat pengatur irama jantung.",
      solusiTinggi: "Tindakan ablasi atau pemasangan alat pacu jantung (pacemaker)."
    },
  ];

  let rules: any[] = [
    { 
      id: 1, 
      disease: "Penyakit Jantung Koroner", 
      diseaseSeverity: "berat",
      conditions: [{ symptomId: "G01", operator: "NONE", severity: "berat" }]
    },
    { 
      id: 2, 
      disease: "Penyakit Jantung Koroner", 
      diseaseSeverity: "sedang",
      conditions: [{ symptomId: "G01", operator: "NONE", severity: "sedang" }]
    },
    { 
      id: 3, 
      disease: "Penyakit Jantung Koroner", 
      diseaseSeverity: "ringan",
      conditions: [{ symptomId: "G01", operator: "NONE", severity: "ringan" }]
    },
    { 
      id: 4, 
      disease: "Penyakit Jantung Koroner", 
      diseaseSeverity: "sedang",
      conditions: [{ symptomId: "G02", operator: "NONE", severity: "sedang" }]
    },
    { 
      id: 5, 
      disease: "Gagal Jantung", 
      diseaseSeverity: "berat",
      conditions: [{ symptomId: "G02", operator: "NONE", severity: "berat" }]
    },
    { 
      id: 6, 
      disease: "Gagal Jantung", 
      diseaseSeverity: "ringan",
      conditions: [{ symptomId: "G03", operator: "NONE", severity: "ringan" }]
    },
    { 
      id: 7, 
      disease: "Aritmia", 
      diseaseSeverity: "sedang",
      conditions: [{ symptomId: "G04", operator: "NONE", severity: "sedang" }]
    },
  ];

  let diagnoses: any[] = [
    { id: 1, patientName: "Budi Santoso", date: "2026-03-20", result: "Penyakit Jantung Koroner", score: 0.85 },
    { id: 2, patientName: "Siti Aminah", date: "2026-03-22", result: "Gagal Jantung", score: 0.72 },
  ];

  // Call seed if necessary (wrap in try-catch to avoid crashing if DB isn't ready)
  if (process.env.DATABASE_URL) {
    seedDatabase().catch(err => console.warn("Seed skipped: Database not reachable"));
  }

  // Auth Middleware
  const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Sesi telah berakhir atau token tidak valid. Silakan login kembali." });
    }
  };

  const checkRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
      }
      next();
    };
  };

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    let user;
    if (process.env.DATABASE_URL) {
      try {
        user = await prisma.user.findUnique({ where: { username } });
      } catch (err) {
        console.error("DB Login fetch error, using fallback");
        user = users.find(u => u.username === username);
      }
    } else {
      user = users.find(u => u.username === username);
    }

    if (!user) return res.status(400).json({ error: "Invalid username or password." });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid username or password." });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });

  app.get("/api/auth/me", verifyToken, (req: any, res) => {
    res.json(req.user);
  });

  // API Routes
  app.get("/api/users", verifyToken, checkRole(["Admin"]), async (req, res) => {
    let usersList;
    if (process.env.DATABASE_URL) {
      try {
        usersList = await prisma.user.findMany({
          select: { id: true, username: true, role: true, name: true, createdAt: true }
        });
      } catch (err) {
        usersList = users.map(({ password, ...u }) => u);
      }
    } else {
      usersList = users.map(({ password, ...u }) => u);
    }
    res.json(usersList);
  });

  app.post("/api/users", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { username, password, role, name } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: "Username already exists" });
        
        const newUser = await prisma.user.create({
          data: { username, password: bcrypt.hashSync(password, 10), role, name }
        });
        const { password: _, ...userWithoutPassword } = newUser;
        return res.json(userWithoutPassword);
      } catch (err) {
        console.warn("DB create error, falling back to memory");
      }
    }

    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password: bcrypt.hashSync(password, 10),
      role,
      name
    };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  });

  app.put("/api/users/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;
    const { username, password, role, name } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id: parseInt(id) },
          data: {
            username: username || undefined,
            role: role || undefined,
            name: name || undefined,
            password: password ? bcrypt.hashSync(password, 10) : undefined
          }
        });
        const { password: _, ...rest } = updatedUser;
        return res.json(rest);
      } catch (err) {
        console.warn("DB update error, falling back to memory");
      }
    }

    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: "User not found" });

    if (username && username !== users[index].username && users.find(u => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    users[index] = {
      ...users[index],
      username: username || users[index].username,
      role: role || users[index].role,
      name: name || users[index].name
    };

    if (password) {
      users[index].password = bcrypt.hashSync(password, 10);
    }

    const { password: _, ...userWithoutPassword } = users[index];
    res.json(userWithoutPassword);
  });

  app.delete("/api/users/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.user.delete({ where: { id: parseInt(id) } });
        return res.json({ message: "User deleted" });
      } catch (err) {
        console.warn("DB delete error, falling back to memory");
      }
    }

    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    users.splice(index, 1);
    res.json({ message: "User deleted" });
  });

  app.get("/api/stats", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const [patientCount, symptomCount, ruleCount, diagnosisCount] = await Promise.all([
          prisma.patient.count(),
          prisma.symptom.count(),
          prisma.rule.count(),
          prisma.diagnosis.count()
        ]);
        return res.json({
          totalPatients: patientCount,
          totalSymptoms: symptomCount,
          totalRules: ruleCount,
          totalDiagnoses: diagnosisCount,
        });
      } catch (err) {
        console.warn("DB stats error, falling back to memory");
      }
    }

    res.json({
      totalPatients: patients.length,
      totalSymptoms: symptoms.length,
      totalRules: rules.length,
      totalDiagnoses: diagnoses.length,
    });
  });

  app.get("/api/patients", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const dbPatients = await prisma.patient.findMany();
        return res.json(dbPatients);
      } catch (err) {
        console.warn("DB patients fetch error");
      }
    }
    res.json(patients);
  });
  
  app.post("/api/patients", verifyToken, checkRole(["Admin", "Staff"]), async (req, res) => {
    const { id, name, department, age, gender, address, phone } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    if (process.env.DATABASE_URL) {
      try {
        const newPatient = await prisma.patient.create({
          data: {
            id: id || Math.random().toString(36).substr(2, 9),
            name,
            department: department || "-",
            age: parseInt(age) || 0,
            gender: gender || "Laki-laki",
            address: address || "-",
            phone: phone || "-"
          }
        });
        return res.json(newPatient);
      } catch (err) {
        console.warn("DB create patient error");
      }
    }

    if (id && patients.find(p => p.id.toString() === id.toString())) {
      return res.status(400).json({ error: "Patient ID must be unique" });
    }

    const newPatient = { 
      id: id || (patients.length > 0 ? Math.max(...patients.map(p => typeof p.id === 'number' ? p.id : 0)) + 1 : 1), 
      name, 
      department: department || "-",
      age: parseInt(age) || 0, 
      gender: gender || "Laki-laki", 
      address: address || "-", 
      phone: phone || "-" 
    };
    patients.push(newPatient);
    res.json(newPatient);
  });

  app.put("/api/patients/:id", verifyToken, checkRole(["Admin", "Staff"]), async (req, res) => {
    const { id: oldId } = req.params;
    const { id: newId, name, department, age, gender, address, phone } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const updatedPatient = await prisma.patient.update({
          where: { id: oldId },
          data: {
            id: newId || undefined,
            name: name || undefined,
            department: department || undefined,
            age: age ? parseInt(age) : undefined,
            gender: gender || undefined,
            address: address || undefined,
            phone: phone || undefined
          }
        });
        return res.json(updatedPatient);
      } catch (err) {
        console.warn("DB update patient error");
      }
    }

    const index = patients.findIndex(p => p.id.toString() === oldId.toString());
    if (index === -1) return res.status(404).json({ error: "Patient not found" });
    
    if (newId && newId.toString() !== oldId.toString() && patients.find(p => p.id.toString() === newId.toString())) {
      return res.status(400).json({ error: "New Patient ID already exists" });
    }

    patients[index] = { 
      ...patients[index], 
      id: newId || patients[index].id,
      name: name || patients[index].name,
      department: department || patients[index].department,
      age: parseInt(age) || patients[index].age,
      gender: gender || patients[index].gender,
      address: address || patients[index].address,
      phone: phone || patients[index].phone
    };
    res.json(patients[index]);
  });

  app.delete("/api/patients/:id", verifyToken, checkRole(["Admin", "Staff"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.patient.delete({ where: { id } });
        return res.json({ message: "Patient deleted" });
      } catch (err) {
        console.warn("DB delete patient error");
      }
    }

    const index = patients.findIndex(p => p.id.toString() === id.toString());
    if (index === -1) return res.status(404).json({ error: "Patient not found" });
    
    patients.splice(index, 1);
    res.json({ message: "Patient deleted" });
  });

  app.post("/api/patients/import", verifyToken, checkRole(["Admin", "Staff"]), async (req, res) => {
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: "Invalid data format" });
    
    if (process.env.DATABASE_URL) {
      try {
        const created = await prisma.patient.createMany({
          data: data.map(item => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.name,
            department: item.department || "-",
            age: parseInt(item.age) || 0,
            gender: item.gender || "Laki-laki",
            address: item.address || "-",
            phone: item.phone || "-"
          })),
          skipDuplicates: true
        });
        return res.json({ message: `${created.count} patients imported successfully` });
      } catch (err) {
        console.warn("DB import error");
      }
    }

    let importedCount = 0;
    data.forEach(item => {
      if (item.name) {
        let id = item.id;
        if (id && patients.find(p => p.id.toString() === id.toString())) {
          return;
        }
        
        const newPatient = {
          id: id || (patients.length > 0 ? Math.max(...patients.map(p => typeof p.id === 'number' ? p.id : 0)) + 1 : 1),
          name: item.name,
          department: item.department || "-",
          age: parseInt(item.age) || 0,
          gender: item.gender || "Laki-laki",
          address: item.address || "-",
          phone: item.phone || "-"
        };
        patients.push(newPatient);
        importedCount++;
      }
    });
    
    res.json({ message: `${importedCount} patients imported successfully` });
  });

  app.get("/api/symptoms", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const dbSymptoms = await prisma.symptom.findMany();
        return res.json(dbSymptoms);
      } catch (err) {
        console.warn("DB symptoms fetch error");
      }
    }
    res.json(symptoms);
  });

  app.get("/api/diseases", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const dbDiseases = await prisma.disease.findMany();
        return res.json(dbDiseases);
      } catch (err) {
        console.warn("DB diseases fetch error");
      }
    }
    res.json(diseases);
  });

  app.get("/api/rules", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const dbRules = await prisma.rule.findMany();
        return res.json(dbRules);
      } catch (err) {
        console.warn("DB rules fetch error");
      }
    }
    res.json(rules);
  });

  app.get("/api/diagnoses", verifyToken, async (req, res) => {
    if (process.env.DATABASE_URL) {
      try {
        const dbDiagnoses = await prisma.diagnosis.findMany();
        return res.json(dbDiagnoses);
      } catch (err) {
        console.warn("DB diagnoses fetch error");
      }
    }
    res.json(diagnoses);
  });

  app.delete("/api/diagnoses/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.diagnosis.delete({ where: { id: parseInt(id) } });
        return res.json({ message: "Diagnosis deleted" });
      } catch (err) {
        console.warn("DB diagnosis delete error");
      }
    }

    const index = diagnoses.findIndex(d => d.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: "Diagnosis not found" });
    
    diagnoses.splice(index, 1);
    res.json({ message: "Diagnosis deleted" });
  });

  app.post("/api/rules", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { conditions, disease, diseaseSeverity } = req.body;
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0 || !disease) {
      return res.status(400).json({ error: "Conditions and Disease are required" });
    }

    if (process.env.DATABASE_URL) {
      try {
        const newRule = await prisma.rule.create({
          data: {
            disease,
            diseaseSeverity: diseaseSeverity || "sedang",
            conditions
          }
        });
        return res.json(newRule);
      } catch (err) {
        console.warn("DB rule create error");
      }
    }

    const newRule = { 
      id: rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1, 
      conditions, 
      disease,
      diseaseSeverity: diseaseSeverity || "sedang"
    };
    rules.push(newRule);
    res.json(newRule);
  });

  app.put("/api/rules/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;
    const { conditions, disease, diseaseSeverity } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const updatedRule = await prisma.rule.update({
          where: { id: parseInt(id) },
          data: {
            conditions,
            disease,
            diseaseSeverity: diseaseSeverity || undefined
          }
        });
        return res.json(updatedRule);
      } catch (err) {
        console.warn("DB rule update error");
      }
    }

    const index = rules.findIndex(r => r.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: "Rule not found" });
    
    rules[index] = { ...rules[index], conditions, disease, diseaseSeverity: diseaseSeverity || rules[index].diseaseSeverity };
    res.json(rules[index]);
  });

  app.delete("/api/rules/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.rule.delete({ where: { id: parseInt(id) } });
        return res.json({ message: "Rule deleted" });
      } catch (err) {
        console.warn("DB rule delete error");
      }
    }

    const index = rules.findIndex(r => r.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: "Rule not found" });
    
    rules.splice(index, 1);
    res.json({ message: "Rule deleted" });
  });

  app.post("/api/diseases", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id, name, description, solusiRendah, solusiRingan, solusiTinggi } = req.body;
    if (!id || !name) return res.status(400).json({ error: "ID and Name are required" });
    
    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.disease.findUnique({ where: { id } });
        if (existing) return res.status(400).json({ error: "Disease code must be unique" });
        const newDisease = await prisma.disease.create({
          data: { id, name, description, solusiRendah, solusiRingan, solusiTinggi }
        });
        return res.json(newDisease);
      } catch (err) {
        console.warn("DB disease create error");
      }
    }

    if (diseases.find(d => d.id === id)) return res.status(400).json({ error: "Disease code must be unique" });
    const newDisease = { id, name, description, solusiRendah, solusiRingan, solusiTinggi };
    diseases.push(newDisease);
    res.json(newDisease);
  });

  app.put("/api/diseases/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;
    const { name, description, solusiRendah, solusiRingan, solusiTinggi } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const updated = await prisma.disease.update({
          where: { id },
          data: { name, description, solusiRendah, solusiRingan, solusiTinggi }
        });
        return res.json(updated);
      } catch (err) {
        console.warn("DB disease update error");
      }
    }

    const index = diseases.findIndex(d => d.id === id);
    if (index === -1) return res.status(404).json({ error: "Disease not found" });
    
    diseases[index] = { ...diseases[index], name, description, solusiRendah, solusiRingan, solusiTinggi };
    res.json(diseases[index]);
  });

  app.delete("/api/diseases/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.disease.delete({ where: { id } });
        return res.json({ message: "Disease deleted" });
      } catch (err) {
        console.warn("DB disease delete error");
      }
    }

    const index = diseases.findIndex(d => d.id === id);
    if (index === -1) return res.status(404).json({ error: "Disease not found" });
    
    diseases.splice(index, 1);
    res.json({ message: "Disease deleted" });
  });

  app.post("/api/symptoms", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id, name, type, cfPakar } = req.body;
    if (!id || !name) return res.status(400).json({ error: "ID and Name are required" });

    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.symptom.findUnique({ where: { id } });
        if (existing) return res.status(400).json({ error: "Symptom code must be unique" });
        const newSymptom = await prisma.symptom.create({
          data: { id, name, type: type || "Gejala Tambahan", cfPakar: parseFloat(cfPakar) || 0 }
        });
        return res.json(newSymptom);
      } catch (err) {
        console.warn("DB symptom create error");
      }
    }

    if (symptoms.find(s => s.id === id)) return res.status(400).json({ error: "Symptom code must be unique" });
    const newSymptom = { id, name, type: type || "Gejala Tambahan", cfPakar: parseFloat(cfPakar) || 0 };
    symptoms.push(newSymptom);
    res.json(newSymptom);
  });

  app.put("/api/symptoms/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;
    const { name, type, cfPakar } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const updated = await prisma.symptom.update({
          where: { id },
          data: { name, type, cfPakar: parseFloat(cfPakar) || 0 }
        });
        return res.json(updated);
      } catch (err) {
        console.warn("DB symptom update error");
      }
    }

    const index = symptoms.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: "Symptom not found" });
    
    symptoms[index] = { ...symptoms[index], name, type, cfPakar: parseFloat(cfPakar) || 0 };
    res.json(symptoms[index]);
  });

  app.delete("/api/symptoms/:id", verifyToken, checkRole(["Admin"]), async (req, res) => {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.symptom.delete({ where: { id } });
        return res.json({ message: "Symptom deleted" });
      } catch (err) {
        console.warn("DB symptom delete error");
      }
    }

    const index = symptoms.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: "Symptom not found" });
    
    symptoms.splice(index, 1);
    res.json({ message: "Symptom deleted" });
  });

  // FUZZY MAMDANI HELPERS
  function fuzzyRingan(x: number): number {
    if (x <= 1) return 1;
    if (x >= 5) return 0;
    return (5 - x) / (5 - 1);
  }

  function fuzzySedang(x: number): number {
    if (x <= 2 || x >= 8) return 0;
    if (x === 5) return 1;
    if (x < 5) return (x - 2) / (5 - 2);
    return (8 - x) / (8 - 5);
  }

  function fuzzyBerat(x: number): number {
    if (x <= 5) return 0;
    if (x >= 9) return 1;
    return (x - 5) / (9 - 5);
  }

  function fuzzify(value: number) {
    return {
      ringan: fuzzyRingan(value),
      sedang: fuzzySedang(value),
      berat: fuzzyBerat(value)
    };
  }

  // Calculation Logic (Fuzzy Mamdani + Certainty Factor)
  app.post("/api/diagnose", verifyToken, checkRole(["Admin", "Staff"]), async (req, res) => {
    const { patientId, selectedSymptoms } = req.body;
    
    // Get current data (either from DB or memory)
    let currentPatients = patients;
    let currentSymptoms = symptoms;
    let currentDiseases = diseases;
    let currentRules = rules;

    if (process.env.DATABASE_URL) {
      try {
        const [dbPatients, dbSymptoms, dbDiseases, dbRules] = await Promise.all([
          prisma.patient.findMany(),
          prisma.symptom.findMany(),
          prisma.disease.findMany(),
          prisma.rule.findMany()
        ]);
        currentPatients = dbPatients;
        currentSymptoms = dbSymptoms;
        currentDiseases = dbDiseases;
        currentRules = dbRules;
      } catch (err) {
        console.warn("DB diagnose data fetch error, using fallback");
      }
    }

    const patient = currentPatients.find(p => p.id.toString() === patientId.toString());
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    console.log(`Diagnosing for patient: ${patient.name}, Symptoms: ${selectedSymptoms.length}`);

    // CRISP MAPPING UNTUK DEFUZZIFIKASI (Skala 0-100)
    const crispMap: any = {
      ringan: 25,
      sedang: 60,
      berat: 100
    };

    let diagnosticResults: any[] = [];

    currentDiseases.forEach(disease => {
      const diseaseRules = currentRules.filter(r => r.disease === disease.name);
      console.log(`- Checking disease: ${disease.name}, Rules found: ${diseaseRules.length}`);
      
      // 1. INFERENSI MAMDANI (MIN) & AGREGASI (MAX)
      // aggregatedFuzzy menyimpan derajat keanggotaan tertinggi untuk setiap kategori severity
      let aggregatedFuzzy = { ringan: 0, sedang: 0, berat: 0 };
      
      // 2. CERTAINTY FACTOR COMBINATION
      // cfCombine menyimpan akumulasi nilai kepastian dari semua rule yang relevan
      let cfCombine = 0;

      diseaseRules.forEach(rule => {
        // --- PROSES FUZZY (INFERENSI) ---
        // Langkah Inferensi: Cari nilai minimum (MIN) dari semua kondisi dalam satu aturan
        // Ini merepresentasikan "seberapa kuat" aturan ini terpenuhi oleh input pengguna
        const alphas = (rule.conditions as any[]).map((cond: any) => {
          const userSymp = selectedSymptoms.find((ss: any) => String(ss.id) === String(cond.symptomId));
          if (!userSymp) {
            console.log(`  Rule ${rule.id}: Symptom ${cond.symptomId} not selected by user.`);
            return 0;
          }
          
          // FUZZIFIKASI: Mengubah nilai krisp (1-10) menjadi derajat keanggotaan fuzzy
          // Kita memetakan Confidence (1-10) ke range nilai Fuzzy (1-9)
          // Confidence tinggi (10) harus menghasilkan derajat keanggotaan tertinggi pada kategori yang dipilih
          const confidence = parseFloat(String(userSymp.confidence || 0)) * 10;
          let value = 5; // Default middle (sedang)
          
          const userIntensity = (userSymp.intensity || "sedang").toLowerCase();
          if (userIntensity === "ringan") {
            // High confidence (10) -> x=1 (Penuh Ringan), Low confidence (1) -> x=5 (Batas Ringan)
            value = 5 - ((confidence - 1) * (5 - 1)) / (10 - 1);
          } else if (userIntensity === "sedang") {
            // High confidence (10) -> x=5 (Penuh Sedang), Low confidence (1) -> x=2 (Batas Sedang)
            value = 2 + ((confidence - 1) * (5 - 2)) / (10 - 1);
          } else if (userIntensity === "berat") {
            // High confidence (10) -> x=9 (Penuh Berat), Low confidence (1) -> x=5 (Batas Berat)
            value = 5 + ((confidence - 1) * (9 - 5)) / (10 - 1);
          }

          const fuzzySet = fuzzify(value);
          const severityKey = (cond.severity || "sedang").toLowerCase();
          const membership = (fuzzySet as any)[severityKey] || 0;
          
          console.log(`  Rule ${rule.id}: Symptom ${cond.symptomId}, Intensity: ${userIntensity}, Conf: ${confidence.toFixed(1)}, Val: ${value.toFixed(2)}, Membership(${severityKey}): ${membership.toFixed(2)}`);
          return membership;
        });

        // Inferensi Mamdani menggunakan fungsi MIN
        const alphaPredikat = alphas.length > 0 ? Math.min(...alphas) : 0;
        
        // AGREGASI: Menggabungkan hasil inferensi dengan aturan lain menggunakan fungsi MAX
        const ruleSeverity = (rule.diseaseSeverity || "sedang").toLowerCase();
        if ((aggregatedFuzzy as any)[ruleSeverity] !== undefined) {
          (aggregatedFuzzy as any)[ruleSeverity] = Math.max((aggregatedFuzzy as any)[ruleSeverity], alphaPredikat);
        }
        
        if (alphaPredikat > 0) {
          console.log(`  Rule ${rule.id} Fires! Alpha: ${alphaPredikat.toFixed(2)}, Disease Severity: ${ruleSeverity}`);
        }
      });

      // --- PROSES CERTAINTY FACTOR ---
      // Kita hitung CF per Penyakit berdasarkan SEMUA gejala yang relevan (tanpa akumulasi ganda per rule)
      // Kumpulkan semua symptomId dari semua rules penyakit ini
      const relevantSymptomIds = new Set<string>();
      diseaseRules.forEach(r => {
        (r.conditions as any[]).forEach(c => relevantSymptomIds.add(String(c.symptomId)));
      });

      relevantSymptomIds.forEach(sympId => {
        const symptom = currentSymptoms.find(s => String(s.id) === sympId);
        const userSymptom = selectedSymptoms.find((ss: any) => String(ss.id) === sympId);
        
        if (symptom && userSymptom) {
          const cfPakar = parseFloat(String(symptom.cfPakar || 0));
          const cfUser = parseFloat(String(userSymptom.confidence || 0));
          const cfRule = cfPakar * cfUser;

          // Kombinasi CF: CF[h,e1,2] = CF[h,e1] + CF[h,e2] * (1 - CF[h,e1])
          if (cfCombine === 0) {
            cfCombine = cfRule;
          } else {
            cfCombine = cfCombine + cfRule * (1 - cfCombine);
          }
        }
      });

      // 3. DEFUZZIFIKASI (SIMPLE CENTROID / WEIGHTED AVERAGE)
      // Mengubah hasil variabel fuzzy kembali menjadi satu nilai krisp
      // Rumus: result = Σ(alpha * z) / Σ(alpha)
      let sumAlphaZ = 0;
      let sumAlpha = 0;
      
      ["ringan", "sedang", "berat"].forEach(key => {
        const alpha = (aggregatedFuzzy as any)[key];
        sumAlphaZ += alpha * crispMap[key];
        sumAlpha += alpha;
      });

      const fuzzyScore = sumAlpha > 0 ? sumAlphaZ / sumAlpha : 0;
      
      // 4. HYBRID FINAL SCORE
      // Menggabungkan bobot Fuzzy Mamdani (50%) dan Certainty Factor (50%)
      // fuzzyScore dinormalisasi (dibagi 100) agar setara dengan skala CF (0-1)
      const finalScore = (0.5 * (fuzzyScore / 100)) + (0.5 * cfCombine);

      diagnosticResults.push({
        diseaseId: disease.id,
        diseaseName: disease.name,
        fuzzyScore: fuzzyScore,
        cfScore: cfCombine,
        finalScore: finalScore,
        diseaseObj: disease,
        aggregatedFuzzy
      });
    });

    if (diagnosticResults.length === 0) {
      return res.status(400).json({ error: "Tidak ada data untuk diagnosis." });
    }
    
    // Sort berdasarkan finalScore tertinggi
    diagnosticResults.sort((a, b) => b.finalScore - a.finalScore);
    
    const bestMatch = diagnosticResults[0];
    
    // Tentukan severity akhir berdasarkan aggregated fuzzy tertinggi
    const fuzzyLevels = bestMatch.aggregatedFuzzy;
    let bestSeverity = "sedang";
    if (fuzzyLevels.berat >= fuzzyLevels.sedang && fuzzyLevels.berat >= fuzzyLevels.ringan && fuzzyLevels.berat > 0) bestSeverity = "berat";
    else if (fuzzyLevels.sedang >= fuzzyLevels.ringan && fuzzyLevels.sedang > 0) bestSeverity = "sedang";
    else if (fuzzyLevels.ringan > 0) bestSeverity = "ringan";

    const diagnosisData = {
      date: new Date().toISOString().split('T')[0],
      patientName: patient.name,
      patientId: patient.id.toString(),
      result: `${bestMatch.diseaseName}`,
      severity: bestSeverity,
      score: bestMatch.finalScore,
      hybridResult: bestMatch.finalScore,
      // Metadata tambahan untuk tracking
      fuzzyScore: bestMatch.fuzzyScore,
      cfScore: bestMatch.cfScore,
      solution: bestSeverity === "berat" ? bestMatch.diseaseObj.solusiTinggi : 
                bestSeverity === "sedang" ? bestMatch.diseaseObj.solusiRingan : 
                bestMatch.diseaseObj.solusiRendah
    };

    if (process.env.DATABASE_URL) {
      try {
        const newDiagnosis = await prisma.diagnosis.create({ data: diagnosisData });
        return res.json(newDiagnosis);
      } catch (err) {
        console.warn("DB diagnosis save error");
      }
    }

    const newDiagnosis = { ...diagnosisData, id: diagnoses.length + 1 };
    diagnoses.push(newDiagnosis);
    res.json(newDiagnosis);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
