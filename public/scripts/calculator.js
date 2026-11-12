// DOM Elements
const serviços = document.querySelector('#serviços');
const comércio = document.querySelector('#comércio');
const transporte = document.querySelector('#transporte');

const despesas = document.querySelector('#despesas');

const receitaBrutaApurado = document.querySelector('#receita-bruta-apurado');
const lucroApurado = document.querySelector('#lucro-apurado');
const lucroIsento = document.querySelector('#lucro-isento');
const lucroTributável = document.querySelector('#lucro-tributável');

// MASKS Setup
const masks = {
	money(value) {
		const cleanValue = +value.replace(/\D+/g, '');
		const options = { style: 'currency', currency: 'BRL' };
		return new Intl.NumberFormat('pt-br', options).format(cleanValue / 100);
	},
};

document.querySelectorAll('input').forEach(($input) => {
	const field = $input.dataset.js;

	$input.addEventListener(
		'input',
		(e) => {
			// Mask the value from input fields to BRL
			e.target.value = masks[field](e.target.value);

			// Get the value from input field
			const serviçosValue = +serviços.value.replace(/\D+/g, '') / 100;
			const comércioValue = +comércio.value.replace(/\D+/g, '') / 100;
			const transporteValue = +transporte.value.replace(/\D+/g, '') / 100;
			const despesasValue = +despesas.value.replace(/\D+/g, '') / 100;

			const options = { style: 'currency', currency: 'BRL' };

			//Receita Bruta Anual
			const receitaBrutaApuradoValue = serviçosValue + comércioValue + transporteValue;

			receitaBrutaApurado.innerText = Intl.NumberFormat('pt-br', options).format(
				receitaBrutaApuradoValue
			);

			// conta
			const contaServiço = document.querySelector('#conta-serviço');
			const contaComércio = document.querySelector('#conta-comércio');
			const contaTransporte = document.querySelector('#conta-transporte');
			contaServiço.innerText = Intl.NumberFormat('pt-br').format(serviçosValue);
			contaComércio.innerText = Intl.NumberFormat('pt-br').format(comércioValue);
			contaTransporte.innerText = Intl.NumberFormat('pt-br').format(transporteValue);

			// Lucro Apurado
			const lucroApuradoValue = receitaBrutaApuradoValue - despesasValue;

			if (lucroApuradoValue < 0) {
				lucroApurado.innerText = 'R$ 0,00';
			} else {
				lucroApurado.innerText = Intl.NumberFormat('pt-br', options).format(lucroApuradoValue);
			}

			// conta
			const contaReceitaBruta = document.querySelector('#conta-receita-bruta');
			const contaDespesas = document.querySelector('#conta-despesas');
			contaReceitaBruta.innerText = Intl.NumberFormat('pt-br').format(receitaBrutaApuradoValue);
			contaDespesas.innerText = Intl.NumberFormat('pt-br').format(despesasValue);

			// Lucro Isento
			const serviçosIsento = serviçosValue * 0.32;
			const comércioIsento = comércioValue * 0.08;
			const transporteIsento = transporteValue * 0.16;

			const lucroIsentoValue = serviçosIsento + comércioIsento + transporteIsento;

			lucroIsento.innerText = Intl.NumberFormat('pt-br', options).format(lucroIsentoValue);

			// conta
			const contaServiçoPorc = document.querySelector('#conta-serviço-p');
			const contaComércioPorc = document.querySelector('#conta-comércio-p');
			const contaTransportePorc = document.querySelector('#conta-transporte-p');
			contaServiçoPorc.innerText = Intl.NumberFormat('pt-br').format(serviçosValue);
			contaComércioPorc.innerText = Intl.NumberFormat('pt-br').format(comércioValue);
			contaTransportePorc.innerText = Intl.NumberFormat('pt-br').format(transporteValue);

			// Lucro Tributável

			// conta
			const contaLucroApurado = document.querySelector('#conta-lucro-apurado');
			const contaRendimendoIsento = document.querySelector('#conta-rendimento-isento');
			contaRendimendoIsento.innerText = Intl.NumberFormat('pt-br').format(lucroIsentoValue);

			const lucroTributavelValue = lucroApuradoValue - lucroIsentoValue;

			if (lucroTributavelValue <= 0) {
				lucroTributável.innerText = 'R$ 0,00';
				contaLucroApurado.innerText = '0';
				contaLucroApurado.innerText = Intl.NumberFormat('pt-br').format(lucroApuradoValue);
			} else {
				lucroTributável.innerText = Intl.NumberFormat('pt-br', options).format(
					lucroTributavelValue
				);
				contaLucroApurado.innerText = Intl.NumberFormat('pt-br').format(lucroApuradoValue);
			}

			// Resultado
			const resultTitle = document.querySelector('#result-title');
			const resultText = document.querySelector('#result-text');

			if (lucroTributavelValue > 35584.0) {
				lucroTributável.classList.add('red');
				resultTitle.innerText = 'OBRIGATÓRIA';
				resultTitle.classList.remove('green');
				resultTitle.classList.add('red');
				resultText.innerHTML =
					'O Rendimento Tributável ficou superior a <b>R$ 35.584,00</b>. Você precisa fazer a declaração no programa disponível pela Receita Federal. Acompanhe abaixo para mais informações.';
			} else {
				lucroTributável.classList.remove('red');
				resultTitle.innerText = 'Não Obrigatória';
				resultTitle.classList.remove('red');
				resultTitle.classList.add('green');
				resultText.innerHTML = `Se você recebeu outros valores como Pessoa Física e a soma desses valores com o
				Rendimento Tributável ficou maior que R$ 35.584,00, será necessário realizar o IRPF.
				Acompanhe abaixo mais informações.`;
			}
		},
		false
	);
});
