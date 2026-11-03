(() => {
    const KEY = 'mkUser';
    const API = 'https://jsonplaceholder.typicode.com/users';
    const AUTO_OPEN_MS = 30000;
    const regexGmail = /^[a-z0-9.]{6,30}@gmail\.com$/i;

    const modal = document.getElementById('modal');
    if (!modal) return;

    const form = modal.querySelector('.modal__form');
    const success = modal.querySelector('.modal__success');
    const gmailInput = modal.querySelector('#gmail_input');
    const phoneInput = modal.querySelector('#phone_input');
    const submitBtn = modal.querySelector('.modal__submit');
    const formMsg = modal.querySelector('.modal__msg');

    let lastFocus = null;
    let autoTimer = null;

    const scheduleOpen = ms => {
        clearTimeout(autoTimer);
        if (isRegistered()) return;
        autoTimer = setTimeout(() => {
            if (isRegistered()) return;
            if (document.body.classList.contains('in-battle')) {
                scheduleOpen(5000);
                return;
            }
            if (modal.classList.contains('active')) return;
            open();
        }, ms);
    };
    const isRegistered = () => {
        try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    };

    const setError = (input, text) => {
        const field = input.closest('.field');
        field.classList.add('invalid');
        field.querySelector('.field__error').textContent = text;
    };

    const clearError = input => {
        const field = input.closest('.field');
        field.classList.remove('invalid');
        field.querySelector('.field__error').textContent = '';
    };

    const phoneDigits = value => {
        let d = value.replace(/\D/g, '');
        if (d.startsWith('996')) d = d.slice(3);
        return d.slice(0, 9);
    };

    const formatPhone = value => {
        const d = phoneDigits(value);
        let out = '+996 ';
        if (d.length) out += d.slice(0, 3);
        if (d.length > 3) out += ' ' + d.slice(3, 5);
        if (d.length > 5) out += '-' + d.slice(5, 7);
        if (d.length > 7) out += '-' + d.slice(7, 9);
        return out;
    };

    const resetForm = () => {
        form.reset();
        phoneInput.value = '+996 ';
        clearError(gmailInput);
        clearError(phoneInput);
        formMsg.textContent = '';
        form.hidden = false;
        success.hidden = true;
    };

    const open = () => {
        lastFocus = document.activeElement;
        modal.classList.add('active');
        setTimeout(() => gmailInput.focus(), 150);
    };

    const close = () => {
        modal.classList.remove('active');
        lastFocus?.focus?.();
        setTimeout(resetForm, 400);
        scheduleOpen(AUTO_OPEN_MS);
    };
    phoneInput.addEventListener('input', () => {
        phoneInput.value = formatPhone(phoneInput.value);
        clearError(phoneInput);
    });

    gmailInput.addEventListener('input', () => clearError(gmailInput));

    form.addEventListener('submit', async e => {
        e.preventDefault();
        formMsg.textContent = '';

        const gmail = gmailInput.value.trim();
        const digits = phoneDigits(phoneInput.value);
        let firstBad = null;

        if (!regexGmail.test(gmail)) {
            setError(gmailInput, 'Введите почту вида example@gmail.com');
            firstBad = firstBad || gmailInput;
        }
        if (digits.length !== 9) {
            setError(phoneInput, 'Нужно 9 цифр после +996');
            firstBad = firstBad || phoneInput;
        }
        if (firstBad) {
            firstBad.focus();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: gmail, phone: '+996' + digits })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await res.json();

            try {
                localStorage.setItem(KEY, JSON.stringify({ gmail, phone: '+996' + digits }));
            } catch (err) {}

            form.hidden = true;
            success.hidden = false;
            setTimeout(close, 1800);
        } catch (err) {
            console.error('Регистрация:', err);
            formMsg.textContent = 'Не удалось отправить. Проверьте интернет и попробуйте ещё раз.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });

    modal.querySelector('.modal__close').addEventListener('click', close);

    modal.addEventListener('click', e => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    document.addEventListener('click', e => {
        if (e.target.closest('[data-open-modal]')) open();
    });

    scheduleOpen(AUTO_OPEN_MS);
})();