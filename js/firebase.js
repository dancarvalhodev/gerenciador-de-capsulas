// O único arquivo que conversa com o Firebase. Explicado em docs/firebase.md.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Vai até a casa pelo endereço e pega o porteiro (login) e o armário (dados).
const conexaoFirebase = initializeApp(firebaseConfig);
const porteiro = getAuth(conexaoFirebase);
const armario = getFirestore(conexaoFirebase);

// "Tire 1" em vez de "agora é 5": o armário faz a conta e nenhuma mudança se perde.
export { increment as somarNoArmario };

/* ---------- login (o porteiro) ---------- */

// Avisa agora e sempre que alguém entra ou sai; `usuario` é null quando ninguém está logado.
export const observarLogin = (aoMudar) => onAuthStateChanged(porteiro, aoMudar);

export const entrarComGoogle = () => signInWithPopup(porteiro, new GoogleAuthProvider());

export const sairDaConta = () => signOut(porteiro);

/* ---------- preferências: a gaveta users/{idDoUsuario} ---------- */

// Fica de olho na gaveta (gaveta vazia = {}); devolve a função que para de observar.
export const observarPreferencias = (idDoUsuario, aoMudar, aoFalhar) =>
  onSnapshot(
    doc(armario, "users", idDoUsuario),
    (gaveta) => aoMudar(gaveta.data() ?? {}),
    aoFalhar,
  );

// `merge: true` altera só os campos enviados e mantém o resto da gaveta.
export const salvarPreferencias = (idDoUsuario, preferencias) =>
  setDoc(doc(armario, "users", idDoUsuario), preferencias, { merge: true });

/* ---------- cápsulas: as fichas em users/{idDoUsuario}/capsulas ---------- */

export function acessarCapsulasDoUsuario(idDoUsuario) {
  const pastaDeCapsulas = collection(armario, "users", idDoUsuario, "capsulas");
  const fichaDaCapsula = (id) => doc(pastaDeCapsulas, id);

  return {
    // Entrega a lista de fichas agora e a cada mudança; devolve a função que para de observar.
    observar: (aoMudar, aoFalhar) =>
      onSnapshot(
        pastaDeCapsulas,
        (pasta) => aoMudar(pasta.docs.map((ficha) => ({ id: ficha.id, ...ficha.data() }))),
        aoFalhar,
      ),
    criar: (dados) => addDoc(pastaDeCapsulas, dados),
    atualizar: (id, camposAlterados) => updateDoc(fichaDaCapsula(id), camposAlterados),
    excluir: (id) => deleteDoc(fichaDaCapsula(id)),
  };
}
