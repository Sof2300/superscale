#ifndef PRICING_H
#define PRICING_H

template <typename T>
void vectorErase(std::vector<T> &vect, T val){
	for(unsigned int i=0;i<vect.size();i++){
		if(val==vect[i]) {vect.erase(vect.begin()+i);return;}
	}
}


class Pricing {
protected:
	std::map<String,float> prices;//={{"Gray/Elm",10.0},{"Golden/Pink/King",12.9},{"Shiitake/Hericium",15.9}};
	std::vector<String> priceorder;//={"Gray/Elm","Golden/Pink/King","Shiitake/Hericium"};
	String selected="";
	float sum=0;
public:

	//	Pricing(){selected="";}

	String getCurrentName(){return selected;}
	bool setPrice(String name, float price){ if(prices[name]==price) return false;prices[name]=price;return true;}
	void removePrice(String name){prices.erase(name);vectorErase(priceorder,name);}
	void addPrice(String name, float price){
		prices[name]=price;
		bool found=false;
		for(String s : priceorder) if(s==name) {found=true;break;}
		if(!found) priceorder.push_back(name);
		if(selected.length()==0) selected=name;
	}
	std::map<String,float> *getPrices(){return &prices;}
	float getCurrentPriceForWeight(float weight){return prices[selected]*weight;}
	String getCurrentPriceForWeightString(float weight){return String()+getCurrentPriceForWeight(weight)+"€";}
	float getCurrentPriceForWeightGram(float weight){return getCurrentPriceForWeight(weight/1000);}
	String getCurrentPriceForWeightStringGram(float weight){return String()+getCurrentPriceForWeightGram(weight)+"€";}

	float getCurrentPrice(){return prices[selected];}
	String getCurrentPriceString(){return String()+getCurrentPrice()+"€";}

	String changeSelected(int i=1){
		int j=0;
		for(String it:priceorder) {if(it==selected) break;else j++;}
		if(prices.size()==0) return selected;
		while (i+j<0) j+=prices.size();
		while (i+j>=(int)prices.size()) j-=prices.size();
		int k=0;
		for(auto it:priceorder) {
			if(k==(i+j)) {selected=it;break;}
			k++;}
		return selected;
	}

	float getSum(){return sum;}
	String getSumString(){return String()+sum+"€";}
	void resetSum(){sum=0;}
	float addSumWeight(float weight){sum+=weight*prices[selected];return sum;};
	float addSumWeightGram(float weight){return addSumWeightGram(weight*1000)*1000;};//???
	float addSumPrice(float price){sum+=price;return sum;};
};


class SuperPricing : public Pricing { // a more complex class would store the items as a map able to give back the detail of the sum
	std::map<String,float> sums;
	std::vector<String> sumorder;
public:

	bool setSum(float v){
		if(sum==v) return false;
		resetSum();
		addSumPrice(v);
		return true;
	}
	float getSum(){return sum;}
	String getSumString(){return String()+sum+"€";}
	void resetSum(){sums.clear();sum=0;sumorder.clear();}
	float addSumWeight(float weight){
		if(sums.find(selected)==sums.end()) {sums[selected]=0;sumorder.push_back(selected);}
		sums[selected]+=getCurrentPriceForWeight(weight);
		sum=0;
		for(auto it : sums){sum+=it.second;}
		return sum;};

	float addSumPrice(float value){
			String sel="product";
			if(sums.find(sel)==sums.end()) {sums[sel]=0;sumorder.push_back(sel);}
			sums[sel]+=value;
			sum=0;
			for(auto it : sums){sum+=it.second;}
			return sum;};

	std::map<String,float> getPriceDetail(){
		return sums;
	};

	bool select(String key){
		if(prices.find(key)!=prices.end()) {selected=key;return true;}
		return false;
	}
	String getPriceDetailString(){
		String ret;
		for(auto it : sumorder) ret+=String()+it+":"+prices[it];
		return ret;
	};

	String getPriceSuperDetailString(){
		String ret;
		for(auto it : sumorder){
			if(ret.length()>0) ret+=",";
			ret+=String()+it+":"+sums[it]/prices[it]+"kg*"+prices[it]+"€/kg ="+sums[it]+"€";
		}
		if(ret.length()>0) ret+=",";
		ret+=String()+"Total:"+sum;
		return ret;
	};
	String getPriceSuperDetailJson(){
		String ret="[";
		for(auto it : sumorder){
			if(it=="product") continue;
			if(ret.length()>1) ret+=",";
			ret+=String()+"{\"name\":\""+it+"\", \"unitprice\":"+prices[it]+",\"price\":"+sums[it]+"}";
		}
		ret+="]";
		return ret;
	};

};



void testPricing(){			// 3 buttons needed : reset sum, add to sum and change price
	SuperPricing pricing;
	Serial.println(String()+"testPricing:: pricing.getCurrentName():"+pricing.getCurrentName());
	Serial.println(String()+"testPricing:: pricing.getCurrentPriceString():"+pricing.getCurrentPriceString());
	pricing.changeSelected();
	Serial.println(String()+"testPricing:: pricing.getCurrentName():"+pricing.getCurrentName());
	Serial.println(String()+"testPricing:: pricing.getCurrentPriceString():"+pricing.getCurrentPriceString());
	pricing.addSumWeight(0.100);
	pricing.changeSelected();
	Serial.println(String()+"testPricing:: pricing.getCurrentName():"+pricing.getCurrentName());
	Serial.println(String()+"testPricing:: pricing.getCurrentPriceString():"+pricing.getCurrentPriceString());
	Serial.println(String()+"testPricing:: pricing.getSumString()1:"+pricing.getSumString());
	Serial.println(String()+"testPricing:: pricing.pricing.getCurrentPriceForWeightStringGram(200)1:"+pricing.getCurrentPriceForWeightStringGram(200));
	pricing.addSumWeight(0.2);
	Serial.println(String()+"testPricing:: pricing.getSumString()3:"+pricing.getSumString());
	pricing.changeSelected();
	pricing.addSumWeight(0.1);
	Serial.println(String()+"testPricing:: pricing.getCurrentName():"+pricing.getCurrentName());
	Serial.println(String()+"testPricing:: pricing.getCurrentPriceString():"+pricing.getCurrentPriceString());
	Serial.println(String()+"testPricing:: pricing.getSumString()1:"+pricing.getSumString());
	Serial.println(String()+"testPricing:: pricing.getPriceSuperDetailString():"+pricing.getPriceSuperDetailString());

	Serial.println(String()+"testPricing:: pricing.getCurrentName():"+pricing.getCurrentName());
	Serial.println(String()+"testPricing:: pricing.getCurrentPriceString():"+pricing.getCurrentPriceString());


}


#endif









