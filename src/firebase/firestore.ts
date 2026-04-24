import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

/** Add a document to a Firestore collection, injecting userId and timestamp */
export async function fsAdd(
  col: string,
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await addDoc(collection(db, col), {
    ...data,
    userId,
    criadoEm: serverTimestamp(),
  })
}

/** Update a document in a Firestore collection */
export async function fsUpdate(
  col: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, col, id), data)
}

/** Delete a document from a Firestore collection */
export async function fsDelete(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id))
}

/** Firestore collection names */
export const COLS = {
  entradas:    'entradas',
  gastos:      'gastos',
  cartoes:     'cartoes',
  parcelas:    'parcelas',
  dividas:     'dividas',
  contasFixas: 'contas_fixas',
  metas:       'metas',
  contas:      'contas_bancarias',
} as const
