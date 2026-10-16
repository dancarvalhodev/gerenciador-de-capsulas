// ============================================================================
// firebase.js: o ÚNICO arquivo que conversa com o Firebase.
//
// Analogia usada nos comentários:
//   - Firebase           = a "casa" na internet onde os dados do app moram.
//   - Authentication     = o "porteiro": confere quem está entrando (conta Google).
//   - Firestore          = o "armário" com as gavetas de cada pessoa.
//   - users/{id}         = a gaveta de uma pessoa (guarda as preferências dela).
//   - users/{id}/capsulas = a pasta de fichas dentro da gaveta (uma ficha por sabor).
//
// O resto do app (app.js) só usa as funções exportadas aqui e nunca fala
// com o Firebase diretamente.
// ============================================================================

// Bibliotecas oficiais do Firebase, baixadas do servidor do Google (versão fixa 12.4.0).
// Cada import traz só as ferramentas que usamos daquela parte do Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth, // pega o porteiro do nosso projeto
  GoogleAuthProvider, // diz ao porteiro: "o login é com conta Google"
  onAuthStateChanged, // avisa sempre que alguém entra ou sai
  signInWithPopup, // abre a janelinha "Escolha uma conta Google"
  signOut, // desconecta a pessoa
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore, // pega o armário do nosso projeto
  collection, // aponta para uma pasta (várias fichas)
  doc, // aponta para uma ficha (ou gaveta) específica
  onSnapshot, // fica "de olho" numa pasta/ficha e avisa a cada mudança
  addDoc, // cria uma ficha nova numa pasta
  updateDoc, // altera alguns campos de uma ficha que já existe
  deleteDoc, // joga uma ficha fora
  setDoc, // grava uma ficha (cria se não existir)
  increment, // "some X ao valor que estiver lá", direto no armário
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// O "endereço da casa" (ver firebase-config.js). Não é senha: pode ser público.
import { firebaseConfig } from "./firebase-config.js";

// Conecta o app ao nosso projeto no Firebase usando o endereço.
const conexaoFirebase = initializeApp(firebaseConfig);
// O porteiro (login) e o armário (dados) desse projeto.
const porteiro = getAuth(conexaoFirebase);
const armario = getFirestore(conexaoFirebase);

// increment(n) é usado no estoque: em vez de "o estoque agora é 5", dizemos
// "some 1" ou "tire 1". Assim, se o celular e o PC mexerem ao mesmo tempo,
// o armário soma as duas mudanças e nenhuma se perde.
export { increment as somarNoArmario };

/* ---------- login (o porteiro) ---------- */

// Chama `aoMudar(usuario)` agora e toda vez que alguém entrar ou sair.
// `usuario` é null quando ninguém está logado.
export const observarLogin = (aoMudar) => onAuthStateChanged(porteiro, aoMudar);

// Abre a janelinha do Google para a pessoa escolher a conta.
export const entrarComGoogle = () => signInWithPopup(porteiro, new GoogleAuthProvider());

export const sairDaConta = () => signOut(porteiro);

/* ---------- preferências: a gaveta users/{idDoUsuario} ---------- */

// Fica de olho na gaveta da pessoa e chama `aoMudar(preferencias)` a cada mudança
// (inclusive mudanças feitas em outro aparelho). Se a gaveta ainda estiver vazia,
// entrega {}. Devolve uma função que, quando chamada, para de observar.
export const observarPreferencias = (idDoUsuario, aoMudar, aoFalhar) =>
  onSnapshot(
    doc(armario, "users", idDoUsuario),
    (gaveta) => aoMudar(gaveta.data() ?? {}),
    aoFalhar,
  );

// Grava as preferências na gaveta. `merge: true` = altera só os campos enviados
// e mantém o resto que já estava lá.
export const salvarPreferencias = (idDoUsuario, preferencias) =>
  setDoc(doc(armario, "users", idDoUsuario), preferencias, { merge: true });

/* ---------- cápsulas: a pasta users/{idDoUsuario}/capsulas ---------- */

// Devolve as 4 ações que o app faz com as fichas de sabores da pessoa.
// O id de cada ficha é criado pelo próprio Firebase.
export function acessarCapsulasDoUsuario(idDoUsuario) {
  const pastaDeCapsulas = collection(armario, "users", idDoUsuario, "capsulas");
  const fichaDaCapsula = (id) => doc(pastaDeCapsulas, id);

  return {
    // Fica de olho na pasta e chama `aoMudar(listaDeCapsulas)` agora e a cada mudança.
    // Cada item da lista é { id, ...campos da ficha }. Devolve a função que para de observar.
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
