import * as clientsApi from "@/api/clients";

export async function loadClients() {
  return clientsApi.listClients();
}

export async function saveClient(input) {
  if (input.id) {
    return clientsApi.updateClient(input.id, input);
  }
  return clientsApi.createClient(input);
}

export async function removeClient(id) {
  return clientsApi.deleteClient(id);
}
