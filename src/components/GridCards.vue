<template>
<div class="row q-col-gutter-lg" ref="cards">
	<div class="col col-xs-12 col-sm-6 col-md-4 col-lg-3"></div>
	<div class="col col-sm-6 col-md-4 col-lg-3 gt-xs"></div>
	<div class="col col-md-4 col-lg-3 gt-sm"></div>
	<div class="col col-lg-3 gt-md"></div>
	<slot></slot>
</div>
</template><script>
import Colcade from 'colcade';
export default {
name: 'grid-cards',
data() {
	return { 
		cards: null
	}
},
mounted() {
	this.loadCards();
},
beforeUpdate() {
	this.removeCards();
},
updated() {
	this.loadCards();
},
destroyed() {
	this.removeCards();
},
methods: {
	loadCards() {
		this.cards = new Colcade(this.$refs.cards, {
			columns: '.col',
			items: '.q-card'
		});
	},
	removeCards() {
		if (this.cards) {
			this.cards.destroy();
			this.cards = null;
			delete this.cards;
		}
	}
}
}
</script>

