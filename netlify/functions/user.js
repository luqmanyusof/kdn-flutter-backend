exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama: 'Ahmad bin Mohamad',
      telefon: '+60123456789',
      email: 'ahmad.mohamad@example.com',
      jawatan: 'Jurutera Perisian',
      nombor_ic: '850123-14-5678',
      no_keahlian: 'K-0012345'
    })
  };
};
