(() => {
    const modal = document.querySelector('.modal');
    if (!modal) return;
    const gmailInput = modal.querySelector('#gmail_input');
    const phoneInput = modal.querySelector('#phone_input');
    const modalBtn = modal.querySelector('.modal_btn');
    const result = modal.querySelector('.result');

    const regexGmail = /^[a-z0-9.]{6,30}@gmail\.com$/i;
    const regexPhone = /^\+996\d{9}$/;
    const KEY = 'mkUser';

    const isRegistered = () => {
        try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    };

    const openModal = () => {
        if (isRegistered()) return;          // уже зарегистрирован, не показываем
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    phoneInput.value = phoneInput.value || '+996 ';
    phoneInput.addEventListener('input', () => {
        if (!phoneInput.value.startsWith('+996')) phoneInput.value = '+996 ';
    });

    modalBtn.addEventListener('click', () => {
        const gmail = gmailInput.value.trim();
        const phone = phoneInput.value.replace(/[\s-]/g, '');

        if (!regexGmail.test(gmail)) {
            result.textContent = 'Введите почту ';
            result.style.color = 'red';
            return;
        }
        if (!regexPhone.test(phone)) {
            result.textContent = 'Введите Телефон';
            result.style.color = 'red';
            return;
        }

        try { localStorage.setItem(KEY, JSON.stringify({ gmail, phone })); } catch (e) {}

        result.textContent = 'Вы успешно зарегистрированы!';
        result.style.color = 'green';
        modalBtn.disabled = true;

        setTimeout(() => {
            closeModal();
            gmailInput.value = '';
            phoneInput.value = '+996 ';
            result.textContent = '';
            modalBtn.disabled = false;
        }, 1200);
    });

    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    setTimeout(openModal, 300);
})();