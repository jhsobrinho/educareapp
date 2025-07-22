
export const calculateAge = (birthdate: string) => {
  const birth = new Date(birthdate);
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
};

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString('pt-BR');
};
