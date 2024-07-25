import styled from 'styled-components';

export const Fon = styled.div`
  display: block;
  box-sizing: border-box;
  background-color: #0e1118;
  width: 100vw;
  height: 100%;
  margin-left: auto;
  margin-right: auto;
  @media screen and (min-width: 600px) {
    max-width: 600px;
  }
`;

export const Header = styled.div`
  display: flex;
  height: 40px;
  color: grey;
  justify-content: center;
  font-size: 25px;
  font-weight: 600;
  border-bottom: solid 2px grey;
  margin-bottom: 15px;
`;
export const Monitor = styled.div``;

export const CurrentPrice = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;

  height: 100px;
  font-size: 70px;
  font-weight: 600;
  margin: 0;
  margin-bottom: 10px;
  color: white;
`;

export const TradeInfo = styled.div`
  display: flex;
  width: 85%;
  justify-content: space-between;
  font-size: 20px;
  font-weight: 600;
  margin-right: auto;
  margin-left: auto;
  margin-bottom: 15px;
  color: white;
`;

export const Info = styled.div`
  display: flex;
  background-color: #161d23;
  width: 98%;
  height: auto;
  margin-left: auto;
  margin-right: auto;
  color: white;
  padding-bottom: 10px;
`;

export const InfoConteiner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 100%;
`;

export const Gallery = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: flex-start;
  width: 100%;
  margin-top: 10px;
`;

export const GalleryElement = styled.div`
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
  width: 20%;
  font-size: 15px;
`;

export const Value = styled.div`
  display: flex;
  width: 19vw;
  height: 19vw;
  border: solid 1px green;
  border-radius: 15px;
  flex-direction: column;

  justify-content: center;
  align-items: center;

  @media screen and (min-width: 600px) {
    width: 114px;
    height: 114px;
  }
`;

export const Title = styled.div`
  display: flex;
  font-size: 9px;
  text-align: center;
  margin-top: 5px;
  justify-content: center;
  align-items: center;
`;

export const Control = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: #161d23;

  width: 98%;
  padding: 10px;
  color: white;
  margin-left: auto;
  margin-right: auto;
`;

export const Data = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const Limits = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-around;
`;

export const Input = styled.input`
  color: white;
  text-align: center;
  margin: 5px 5px;

  display: block;
  border: none;

  border-bottom: solid 2px green;
  transition: all 0.3s cubic-bezier(0.64, 0.09, 0.08, 1);
  background: linear-gradient(
    0deg,
    rgba(22, 29, 35, 1) 9%,
    rgba(24, 31, 38, 1) 24%,
    rgba(33, 43, 52, 1) 54%,
    rgba(44, 58, 70, 1) 79%
  );
  background-position: -200px 0;
  background-size: 200px 100%;
  color: darken(green, 20%);
`;

export const InputLimit = styled.div`
  display: flex;
  width: 45%;
  justify-content: space-between;
`;
